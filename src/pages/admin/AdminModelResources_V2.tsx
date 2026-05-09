import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import BatchOperations from "@/components/admin/BatchOperations";
import StagedCrudToolbar from "@/components/admin/StagedCrudToolbar";
import BulkEditBar from "@/components/admin/BulkEditBar";
import type { StagedItem } from "@/utils/stagedCrud";
import { getActivityStatusColor, getActivityStatusLabel } from "@/utils/fieldLabels";
import { compressImage } from "@/utils/imageCompression";

type Category = 'vr_exterior' | 'vr_interior' | 'official' | 'exterior' | 'interior';

type Picture = {
  id: string;
  model_jm_id: number;
  category: Category;
  image_url: string;
  sort_order: number;
  brand_name?: string;
  brand_jm_id?: number;
  series_name?: string;
  series_jm_id?: number;
  model_name?: string;
  activity_status?: number | null;
  created_at: string;
  updated_at: string;
};

type DbBrand = {
  id: string;
  jm_id: number;
  name: string;
  initial: string | null;
  logo_url: string | null;
  parent_id: number;
  depth: number;
  activity_status: number;
  created_at: string;
  updated_at: string;
};

type DbSeries = {
  id: string;
  jm_id: number;
  brand_jm_id: number;
  brand_id: string | null;
  name: string;
  fullname: string | null;
  initial: string | null;
  logo_url: string | null;
  salestate: string | null;
  depth: number;
  subcompany_name: string | null;
  subcompany_jm_id: number | null;
  activity_status: number;
  created_at: string;
  updated_at: string;
};

type DbModel = {
  id: string;
  jm_id: number;
  series_jm_id: number;
  series_id: string | null;
  brand_jm_id: number;
  brand_id: string | null;
  name: string;
  groupid: string | null;
  groupname: string | null;
  sizetype: string | null;
  displacement2: string | null;
  displacement: string | null;
  geartype: string | null;
  geartype2: number | null;
  logo_url: string | null;
  yeartype: string | null;
  listdate: string | null;
  price: string | null;
  productionstate: string | null;
  salestate: string | null;
  depth: number;
  created_at: string;
  updated_at: string;
};

const resourceTypes: { type: Category; label: string }[] = [
  { type: 'vr_exterior', label: '外观VR图集' },
  { type: 'vr_interior', label: '内饰VR图集' },
  { type: 'official', label: '官方图集' },
  { type: 'exterior', label: '外观图集' },
  { type: 'interior', label: '内饰图集' },
];

export default function AdminModelResources_V2() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'db-view'>('config');
  const [dbBrands, setDbBrands] = useState<DbBrand[]>([]);
  const [dbBrandsLoading, setDbBrandsLoading] = useState(false);
  const [dbSeries, setDbSeries] = useState<DbSeries[]>([]);
  const [dbSeriesLoading, setDbSeriesLoading] = useState(false);
  const [dbModels, setDbModels] = useState<DbModel[]>([]);
  const [dbModelsLoading, setDbModelsLoading] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [selectedBrandDb, setSelectedBrandDb] = useState<DbBrand | null>(null);
  const [selectedSeriesDb, setSelectedSeriesDb] = useState<DbSeries | null>(null);
  const [selectedModelDb, setSelectedModelDb] = useState<DbModel | null>(null);
  const [brandSearchQuery, setBrandSearchQuery] = useState<string>("");
  const [seriesSearchQuery, setSeriesSearchQuery] = useState<string>("");
  const [modelSearchQuery, setModelSearchQuery] = useState<string>("");

  const [pictures, setPictures] = useState<Record<Category, Picture[]>>({
    vr_exterior: [],
    vr_interior: [],
    official: [],
    exterior: [],
    interior: []
  });
  const [picturesLoading, setPicturesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [folderUploadProgress, setFolderUploadProgress] = useState<{
    total: number;
    current: number;
    currentType: string;
  } | null>(null);

  const [dbPictures, setDbPictures] = useState<Picture[]>([]);
  const [viewPictures, setViewPictures] = useState<Picture[]>([]);
  const [dbPicturesLoading, setDbPicturesLoading] = useState(false);
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [commitBusy, setCommitBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const carPicturesFields = [
    'id',
    'model_jm_id',
    'category',
    'image_url',
    'sort_order',
    'activity_status',
    'brand_name',
    'brand_jm_id',
    'series_name',
    'series_jm_id',
    'model_name',
    'created_at',
    'updated_at',
  ];

  const getCarPicturesLabel = (field: string) => {
    const map: Record<string, string> = {
      id: 'ID',
      model_jm_id: '车型 jm_id',
      category: '分类',
      image_url: '图片链接',
      sort_order: '排序',
      activity_status: '状态',
      brand_name: '品牌名',
      brand_jm_id: '品牌 jm_id',
      series_name: '车系名',
      series_jm_id: '车系 jm_id',
      model_name: '车型名',
      created_at: '创建时间',
      updated_at: '更新时间',
    };
    return map[field] || field;
  };

  // 加载品牌列表
  async function loadDbBrands() {
    setDbBrandsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('depth', 1)
        .order('name', { ascending: true });

      if (error) throw error;
      setDbBrands(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载品牌数据库失败');
    } finally {
      setDbBrandsLoading(false);
    }
  }

  // 加载车系列表
  async function loadDbSeries() {
    if (!selectedBrandId) {
      setDbSeries([]);
      return;
    }
    setDbSeriesLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('series')
        .select('*')
        .eq('brand_jm_id', selectedBrandId)
        .order('name', { ascending: true });

      if (error) throw error;
      setDbSeries(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载车系数据库失败');
    } finally {
      setDbSeriesLoading(false);
    }
  }

  // 加载车型列表
  async function loadDbModels() {
    if (!selectedSeriesId) {
      setDbModels([]);
      return;
    }
    setDbModelsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('models_jumdata')
        .select('*')
        .eq('series_jm_id', selectedSeriesId)
        .order('name', { ascending: true });

      if (error) throw error;
      setDbModels(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载车型数据库失败');
    } finally {
      setDbModelsLoading(false);
    }
  }

  // 加载已上传的图片
  async function loadPictures() {
    if (!selectedModelDb) {
      setPictures({
        vr_exterior: [],
        vr_interior: [],
        official: [],
        exterior: [],
        interior: []
      });
      return;
    }

    setPicturesLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('car_pictures')
        .select('*')
        .eq('model_jm_id', selectedModelDb.jm_id)
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) {
        setPictures({
          vr_exterior: [],
          vr_interior: [],
          official: [],
          exterior: [],
          interior: []
        });
      } else {
        const grouped: Record<Category, Picture[]> = {
          vr_exterior: [],
          vr_interior: [],
          official: [],
          exterior: [],
          interior: []
        };
        data?.forEach(pic => {
          if (grouped[pic.category as Category]) {
            grouped[pic.category as Category].push(pic);
          }
        });
        setPictures(grouped);
      }
    } catch (e) {
      setPictures({
        vr_exterior: [],
        vr_interior: [],
        official: [],
        exterior: [],
        interior: []
      });
    } finally {
      setPicturesLoading(false);
    }
  }

  function isRowDeleted(id: string) {
    return stagedItems.some(it => it.tableName === 'car_pictures' && it.op === 'delete' && it.id === id);
  }

  function applyStagedToPictures(base: Picture[], staged: StagedItem[]): Picture[] {
    let rows = [...base];
    const inserts = staged.filter(it => it.tableName === 'car_pictures' && it.op === 'insert');
    const updates = staged.filter(it => it.tableName === 'car_pictures' && it.op === 'update');

    for (const up of updates) {
      if (!up.id) continue;
      const idx = rows.findIndex(r => r.id === up.id);
      if (idx === -1) continue;
      rows[idx] = { ...rows[idx], ...(up.changes || {}) };
    }

    for (const ins of inserts) {
      const data = ins.data || {};
      const row: Picture = {
        id: ins.key,
        model_jm_id: Number(data.model_jm_id || 0),
        category: (data.category || 'official') as Category,
        image_url: String(data.image_url || ''),
        sort_order: Number(data.sort_order || 0),
        brand_name: data.brand_name || null,
        brand_jm_id: data.brand_jm_id || null,
        series_name: data.series_name || null,
        series_jm_id: data.series_jm_id || null,
        model_name: data.model_name || null,
        activity_status: data.activity_status ?? 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      rows.unshift(row);
    }

    return rows;
  }

  function stageInsert(data: Record<string, any>) {
    const key = `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const item: StagedItem = { key, op: 'insert', tableName: 'car_pictures', data };
    setStagedItems(prev => [item, ...prev]);
  }

  function stageUpdate(id: string, field: string, value: any) {
    setViewPictures(prev => prev.map(r => (r.id === id ? ({ ...r, [field]: value } as any) : r)));
    setStagedItems(prev => {
      const copy = [...prev];
      const insertIdx = copy.findIndex(it => it.tableName === 'car_pictures' && it.op === 'insert' && it.key === id);
      if (insertIdx !== -1) {
        const it = copy[insertIdx];
        copy[insertIdx] = { ...it, data: { ...(it.data || {}), [field]: value } };
        return copy;
      }

      const idx = copy.findIndex(it => it.tableName === 'car_pictures' && it.op === 'update' && it.id === id);
      if (idx === -1) {
        copy.unshift({ key: `upd_${id}`, op: 'update', tableName: 'car_pictures', id, changes: { [field]: value } });
        return copy;
      }

      copy[idx] = { ...copy[idx], changes: { ...(copy[idx].changes || {}), [field]: value } };
      return copy;
    });
  }

  function addNewRow() {
    const tempId = `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const row: Picture = {
      id: tempId,
      model_jm_id: selectedModelDb?.jm_id ?? 0,
      category: 'official',
      image_url: '',
      sort_order: 0,
      brand_name: selectedBrandDb?.name,
      brand_jm_id: selectedBrandDb?.jm_id,
      series_name: selectedSeriesDb?.name,
      series_jm_id: selectedSeriesDb?.jm_id,
      model_name: selectedModelDb?.name,
      activity_status: 0,
      created_at: '',
      updated_at: '',
    };
    setViewPictures(prev => [row, ...prev]);
    setStagedItems(prev => [...prev, { key: tempId, op: 'insert', tableName: 'car_pictures', data: { ...row, id: undefined, created_at: undefined, updated_at: undefined } }]);
  }

  function toggleDeleteRow(rowId: string) {
    const isTemp = rowId.startsWith('tmp_');
    if (isTemp) {
      setViewPictures(prev => prev.filter(r => r.id !== rowId));
      setStagedItems(prev => prev.filter(it => !(it.tableName === 'car_pictures' && it.key === rowId)));
      setSelectedIds(prev => prev.filter(id => id !== rowId));
      return;
    }

    setStagedItems(prev => {
      const existing = prev.find(it => it.tableName === 'car_pictures' && it.key === rowId);
      if (existing?.op === 'delete') {
        return prev.filter(it => !(it.tableName === 'car_pictures' && it.key === rowId));
      }
      return [...prev.filter(it => !(it.tableName === 'car_pictures' && it.key === rowId)), { key: rowId, op: 'delete', tableName: 'car_pictures', id: rowId }];
    });
  }

  function discardAll() {
    if (stagedItems.length === 0) return;
    const ok = window.confirm('将撤销当前未提交的全部修改，是否继续？');
    if (!ok) return;
    setStagedItems([]);
    setSelectedIds([]);
    setViewPictures([...dbPictures]);
  }

  async function loadDbPictures(nextStaged?: StagedItem[]) {
    setDbPicturesLoading(true);
    setError(null);
    try {
      let query = supabase.from('car_pictures').select('*');
      if (selectedModelId) {
        query = query.eq('model_jm_id', selectedModelId);
      } else if (selectedSeriesId) {
        query = query.eq('series_jm_id', selectedSeriesId);
      } else if (selectedBrandId) {
        query = query.eq('brand_jm_id', selectedBrandId);
      }
      const { data, error } = await query
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true })
        .order('updated_at', { ascending: false });

      if (error) throw error;
      const rows = (data || []) as Picture[];
      setDbPictures(rows);
      setViewPictures(applyStagedToPictures(rows, nextStaged ?? stagedItems));
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载展示资源数据库失败');
    } finally {
      setDbPicturesLoading(false);
    }
  }

  async function commitStaged() {
    const scoped = stagedItems.filter(it => it.tableName === 'car_pictures');
    if (scoped.length === 0) return;
    const ok = window.confirm(`将提交 ${scoped.length} 条变更到数据库，是否继续？`);
    if (!ok) return;
    setCommitBusy(true);
    setError(null);
    try {
      const inserts = scoped.filter(it => it.op === 'insert');
      const updates = scoped.filter(it => it.op === 'update');
      const deletes = scoped.filter(it => it.op === 'delete');
      const failed: StagedItem[] = [];

      for (const it of inserts) {
        const data = it.data || {};
        const payload: any = {
          model_jm_id: Number(data.model_jm_id),
          category: data.category,
          image_url: data.image_url,
          sort_order: Number(data.sort_order ?? 0),
          brand_name: data.brand_name ?? selectedBrandDb?.name ?? null,
          brand_jm_id: data.brand_jm_id ?? selectedBrandDb?.jm_id ?? null,
          series_name: data.series_name ?? selectedSeriesDb?.name ?? null,
          series_jm_id: data.series_jm_id ?? selectedSeriesDb?.jm_id ?? null,
          model_name: data.model_name ?? selectedModelDb?.name ?? null,
          activity_status: data.activity_status ?? 0,
        };
        if (!payload.model_jm_id || !payload.category || !payload.image_url) {
          failed.push(it);
          continue;
        }
        const { error: insertError } = await supabase.from('car_pictures').insert(payload);
        if (insertError) failed.push(it);
      }

      for (const it of updates) {
        if (!it.id) {
          failed.push(it);
          continue;
        }
        const changes = it.changes || {};
        const { error: updateError } = await supabase.from('car_pictures').update(changes).eq('id', it.id);
        if (updateError) failed.push(it);
      }

      for (const it of deletes) {
        if (!it.id) {
          failed.push(it);
          continue;
        }
        const { error: deleteError } = await supabase.from('car_pictures').delete().eq('id', it.id);
        if (deleteError) failed.push(it);
      }

      setStagedItems(failed);
      await loadDbPictures(failed);
      if (failed.length === 0) {
        setError('数据库更新成功');
      } else {
        setError(`有 ${failed.length} 条变更提交失败，请检查字段或权限后重试。`);
      }
    } finally {
      setCommitBusy(false);
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.length === viewPictures.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(viewPictures.map(p => p.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleBatchUpdate = async (status: number) => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      stageUpdate(id, 'activity_status', status);
    }
  };

  // 品牌选择变化
  useEffect(() => {
    if (selectedBrandId) {
      loadDbSeries();
      setSelectedSeriesId(null);
      setSelectedModelId(null);
      setSelectedSeriesDb(null);
      setSelectedModelDb(null);
    }
  }, [selectedBrandId]);

  // 车系选择变化
  useEffect(() => {
    if (selectedSeriesId) {
      loadDbModels();
      setSelectedModelId(null);
      setSelectedModelDb(null);
    }
  }, [selectedSeriesId]);

  // 车型选择变化
  useEffect(() => {
    if (selectedModelId) {
      const model = dbModels.find(m => m.jm_id === selectedModelId);
      if (model) {
        setSelectedModelDb(model);
        loadPictures();
      }
    }
  }, [selectedModelId, dbModels]);

  // 初始加载品牌
  useEffect(() => {
    loadDbBrands();
  }, []);

  useEffect(() => {
    if (activeTab === 'db-view') {
      loadDbPictures();
    }
  }, [activeTab, selectedBrandId, selectedSeriesId, selectedModelId]);

  // 测试连接
  const testConnection = async () => {
    setError('正在测试连接...');

    try {
      const { data: bucketData, error: bucketError } = await supabase
        .storage
        .from('car-images')
        .list('', { limit: 1 });

      if (bucketError) {
        setError(`❌ car-images 存储桶不存在！请运行 999_simple_solution.sql`);
        return;
      }
      const { data: tableData, error: tableError } = await supabase
        .from('car_pictures')
        .select('id')
        .limit(1);

      if (tableError) {
        setError(`❌ car_pictures 表不存在！请运行 999_simple_solution.sql`);
        return;
      }
      setError('✅ 连接测试通过！可以正常上传！');
    } catch (testError) {
      setError(`❌ 连接测试失败: ${testError}`);
    }
  };

  // 映射文件夹名到分类
  const mapFolderToCategory = (name: string): Category => {
    const normalized = name.toLowerCase().trim();
    if (normalized.includes('vr') && normalized.includes('外')) return 'vr_exterior';
    if (normalized.includes('vr') && normalized.includes('内')) return 'vr_interior';
    if (normalized.includes('官') || normalized.includes('official')) return 'official';
    if (normalized.includes('外')) return 'exterior';
    if (normalized.includes('内')) return 'interior';
    return 'official'; // 默认官方
  };

  // 处理文件夹上传
  const handleFolderUpload = async (files: File[]) => {
    if (!selectedModelDb) {
      setError('请先选择车型');
      return;
    }

    setUploading(true);
    setError(null);
    setFolderUploadProgress({ total: files.length, current: 0, currentType: '' });

    try {
      // 按文件夹分组
      const groupedFiles: Record<Category, File[]> = {
        vr_exterior: [],
        vr_interior: [],
        official: [],
        exterior: [],
        interior: []
      };

      for (const file of files) {
        const path = file.webkitRelativePath || file.name;
        const pathParts = path.split('/');

        let category: Category = 'official';
        for (let i = pathParts.length - 2; i >= 0; i--) {
          category = mapFolderToCategory(pathParts[i]);
          if (category !== 'official') break;
        }
        if (category === 'official') {
          category = mapFolderToCategory(file.name);
        }

        groupedFiles[category].push(file);
      }

      for (const [category, typeFiles] of Object.entries(groupedFiles)) {
        if (typeFiles.length === 0) continue;

        const cat = category as Category;
        const typeLabel = resourceTypes.find(r => r.type === cat)?.label || cat;
        setFolderUploadProgress(prev => prev ? { ...prev, currentType: typeLabel } : null);

        const uploaded: Picture[] = [];

        for (let i = 0; i < typeFiles.length; i++) {
          const file = typeFiles[i];
          const ext = file.name.split('.').pop() || 'jpg';
          const fileName = `car_${selectedModelDb.jm_id}_${cat}_${Date.now()}_${i}.${ext}`;

          // 压缩图片
          const compressed = await compressImage(file, {
            maxSizeMB: 0.6,
            maxWidthOrHeight: 2048,
          });

          // 上传到新存储桶
          const { error: uploadError } = await supabase
            .storage
            .from('car-images')
            .upload(fileName, compressed.blob, { 
              cacheControl: '3600',
              contentType: compressed.blob.type || file.type 
            });

          if (uploadError) {
            throw new Error(`存储桶上传失败: ${uploadError.message}`);
          }

          // 获取 URL
          const { data: urlData } = supabase
            .storage
            .from('car-images')
            .getPublicUrl(fileName);

          const imageUrl = urlData.publicUrl;

          // 计算排序
          const currentPics = pictures[cat];
          const sortOrder = currentPics.length > 0
            ? Math.max(...currentPics.map(p => p.sort_order)) + 1
            : 0;

          // 保存到新表
          const { data: picData, error: dbError } = await supabase
            .from('car_pictures')
            .insert({
              model_jm_id: selectedModelDb.jm_id,
              category: cat,
              image_url: imageUrl,
              sort_order: sortOrder,
              brand_name: selectedBrandDb?.name,
              brand_jm_id: selectedBrandDb?.jm_id,
              series_name: selectedSeriesDb?.name,
              series_jm_id: selectedSeriesDb?.jm_id,
              model_name: selectedModelDb.name,
            })
            .select()
            .single();

          if (dbError) {
            throw new Error(`数据库保存失败: ${dbError.message}`);
          }

          uploaded.push(picData as Picture);

          const processed = Object.entries(groupedFiles).reduce((sum, [c, arr], idx) => {
            if (idx < Object.keys(groupedFiles).indexOf(category)) return sum + arr.length;
            if (idx === Object.keys(groupedFiles).indexOf(category)) return sum + i + 1;
            return sum;
          }, 0);
          setUploadProgress(Math.round((processed / files.length) * 100));
          setFolderUploadProgress(prev => prev ? { ...prev, current: processed } : null);
        }

        // 更新该分类的列表
        setPictures(prev => ({
          ...prev,
          [cat]: [...prev[cat], ...uploaded].sort((a, b) => a.sort_order - b.sort_order)
        }));
      }

    } catch (e) {
      setError(e instanceof Error ? e.message : '上传失败');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setFolderUploadProgress(null);
    }
  };

  // 处理单个分类文件上传
  const handleFileUpload = async (category: Category, files: FileList) => {
    if (!selectedModelDb) {
      setError('请先选择车型');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const uploaded: Picture[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `car_${selectedModelDb.jm_id}_${category}_${Date.now()}_${i}.${ext}`;

        // 压缩图片
        const compressed = await compressImage(file, {
          maxSizeMB: 0.6,
          maxWidthOrHeight: 2048,
        });

        // 上传到新存储桶
        const { error: uploadError } = await supabase
          .storage
          .from('car-images')
          .upload(fileName, compressed.blob, { 
            cacheControl: '3600',
            contentType: compressed.blob.type || file.type 
          });

        if (uploadError) {
          throw new Error(`存储桶上传失败: ${uploadError.message}`);
        }

        // 获取 URL
        const { data: urlData } = supabase
          .storage
          .from('car-images')
          .getPublicUrl(fileName);

        const imageUrl = urlData.publicUrl;

        // 计算排序
        const currentPics = pictures[category];
        const sortOrder = currentPics.length > 0
          ? Math.max(...currentPics.map(p => p.sort_order)) + 1
          : 0;

        // 保存到新表
        const { data: picData, error: dbError } = await supabase
          .from('car_pictures')
          .insert({
            model_jm_id: selectedModelDb.jm_id,
            category: category,
            image_url: imageUrl,
            sort_order: sortOrder,
            brand_name: selectedBrandDb?.name,
            brand_jm_id: selectedBrandDb?.jm_id,
            series_name: selectedSeriesDb?.name,
            series_jm_id: selectedSeriesDb?.jm_id,
            model_name: selectedModelDb.name,
          })
          .select()
          .single();

        if (dbError) {
          throw new Error(`数据库保存失败: ${dbError.message}`);
        }

        uploaded.push(picData as Picture);

        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      // 更新列表
      setPictures(prev => ({
        ...prev,
        [category]: [...prev[category], ...uploaded].sort((a, b) => a.sort_order - b.sort_order)
      }));

      setError(`✅ 上传成功！共 ${files.length} 张图片`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '上传失败');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // 删除图片
  const handleDelete = async (category: Category, picId: string) => {
    try {
      const { error } = await supabase
        .from('car_pictures')
        .delete()
        .eq('id', picId);

      if (error) throw error;

      setPictures(prev => ({
        ...prev,
        [category]: prev[category].filter(p => p.id !== picId)
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败');
    }
  };

  // 筛选品牌
  const filteredBrands = brandSearchQuery.trim() === ""
    ? dbBrands
    : dbBrands.filter(brand => brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase()));

  // 筛选车系
  const filteredSeries = seriesSearchQuery.trim() === ""
    ? dbSeries
    : dbSeries.filter(series => series.name.toLowerCase().includes(seriesSearchQuery.toLowerCase()));

  // 筛选车型
  const filteredModels = modelSearchQuery.trim() === ""
    ? dbModels
    : dbModels.filter(model => model.name.toLowerCase().includes(modelSearchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* 车型选择 */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">车型选择</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 品牌选择 */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">品牌</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={brandSearchQuery}
                onChange={(e) => setBrandSearchQuery(e.target.value)}
                placeholder="搜索品牌"
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2">
              {dbBrandsLoading ? (
                <div className="text-sm text-zinc-500">加载中...</div>
              ) : filteredBrands.length === 0 ? (
                <div className="text-sm text-zinc-500">无品牌数据</div>
              ) : (
                filteredBrands.map((brand) => (
                  <button
                    key={brand.jm_id}
                    type="button"
                    className={`w-full text-left rounded px-3 py-2 text-sm transition-colors ${selectedBrandId === brand.jm_id ? 'bg-blue-50 text-blue-600' : 'text-zinc-700 hover:bg-zinc-100'}`}
                    onClick={() => {
                      setSelectedBrandId(brand.jm_id);
                      setSelectedBrandDb(brand);
                      setBrandSearchQuery(brand.name);
                    }}
                  >
                    {brand.name}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 车系选择 */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">车系</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={seriesSearchQuery}
                onChange={(e) => setSeriesSearchQuery(e.target.value)}
                placeholder="搜索车系"
                disabled={!selectedBrandId}
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2">
              {dbSeriesLoading ? (
                <div className="text-sm text-zinc-500">加载中...</div>
              ) : !selectedBrandId ? (
                <div className="text-sm text-zinc-500">请先选择品牌</div>
              ) : filteredSeries.length === 0 ? (
                <div className="text-sm text-zinc-500">无车系数据</div>
              ) : (
                filteredSeries.map((series) => (
                  <button
                    key={series.jm_id}
                    type="button"
                    className={`w-full text-left rounded px-3 py-2 text-sm transition-colors ${selectedSeriesId === series.jm_id ? 'bg-blue-50 text-blue-600' : 'text-zinc-700 hover:bg-zinc-100'}`}
                    onClick={() => {
                      setSelectedSeriesId(series.jm_id);
                      setSelectedSeriesDb(series);
                      setSeriesSearchQuery(series.name);
                    }}
                  >
                    {series.name}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* 车型选择 */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">车型</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={modelSearchQuery}
                onChange={(e) => setModelSearchQuery(e.target.value)}
                placeholder="搜索车型"
                disabled={!selectedSeriesId}
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2">
              {dbModelsLoading ? (
                <div className="text-sm text-zinc-500">加载中...</div>
              ) : !selectedSeriesId ? (
                <div className="text-sm text-zinc-500">请先选择车系</div>
              ) : filteredModels.length === 0 ? (
                <div className="text-sm text-zinc-500">无车型数据</div>
              ) : (
                filteredModels.map((model) => (
                  <button
                    key={model.jm_id}
                    type="button"
                    className={`w-full text-left rounded px-3 py-2 text-sm transition-colors ${selectedModelId === model.jm_id ? 'bg-blue-50 text-blue-600' : 'text-zinc-700 hover:bg-zinc-100'}`}
                    onClick={() => {
                      setSelectedModelId(model.jm_id);
                      setModelSearchQuery(model.name);
                    }}
                  >
                    {model.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 已选车型信息 */}
        {selectedModelDb && (
          <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="text-sm text-green-800 space-y-1">
              <div><strong>品牌:</strong> {selectedBrandDb?.name}</div>
              <div><strong>车系:</strong> {selectedSeriesDb?.name}</div>
              <div><strong>车型:</strong> {selectedModelDb.name}</div>
              <div><strong>jm_id:</strong> {selectedModelDb.jm_id}</div>
            </div>
          </div>
        )}
      </div>

      <div className="border-b border-zinc-200">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'db-view' && stagedItems.length > 0) {
                const ok = window.confirm('数据库视图存在未提交变更，切换将保留草稿但可能影响筛选结果，是否继续？');
                if (!ok) return;
              }
              setActiveTab('config');
            }}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === 'config'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            资源配置
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('db-view')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === 'db-view'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            数据库视图
          </button>
        </div>
      </div>

      {/* 资源配置 */}
      {activeTab === 'config' ? (selectedModelDb ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-900">展示资源配置 (V2 新方案)</h2>
            <button
              type="button"
              onClick={testConnection}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              🔍 测试连接
            </button>
          </div>

          {error && (
            <div className={`mb-4 p-4 rounded-lg ${error.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {error}
            </div>
          )}

          {uploading && (
            <div className="mb-4 p-4 rounded-lg bg-blue-50">
              <div className="text-sm text-blue-800">上传中... {uploadProgress}%</div>
              {folderUploadProgress && (
                <div className="mt-2 text-xs text-blue-600">
                  {folderUploadProgress.currentType} {folderUploadProgress.current}/{folderUploadProgress.total}
                </div>
              )}
            </div>
          )}

          {/* 文件夹上传与一键下载 */}
          <div className="mb-6 rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 p-6 flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-[300px]">
              <h3 className="text-md font-semibold text-zinc-900 mb-2">文件夹批量上传</h3>
              <p className="text-sm text-zinc-600 mb-4">
                支持上传整个车型文件夹，自动识别子文件夹分类（外观VR、内饰VR、官图等）
              </p>
              <div className="relative inline-block">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                >
                  选择车型文件夹
                </button>
                <input
                  type="file"
                  {...({
                    webkitdirectory: "",
                    directory: ""
                  } as React.InputHTMLAttributes<HTMLInputElement>)}
                  multiple
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      handleFolderUpload(files);
                    }
                  }}
                />
              </div>
            </div>
            
          </div>
            {folderUploadProgress && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">
                    上传进度: {folderUploadProgress.current}/{folderUploadProgress.total}
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    {folderUploadProgress.currentType && `正在处理: ${folderUploadProgress.currentType}`}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(folderUploadProgress.current / folderUploadProgress.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

          {/* 资源类型列表 */}
          <div className="space-y-4">
            {resourceTypes.map(({ type, label }) => (
              <div key={type} className="border border-zinc-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-zinc-900">{label}</h3>
                  <div className="relative">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                    >
                      上传图片
                    </button>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileUpload(type, e.target.files);
                        }
                      }}
                    />
                  </div>
                </div>

                {picturesLoading ? (
                  <div className="text-sm text-zinc-500">加载中...</div>
                ) : pictures[type].length === 0 ? (
                  <div className="text-sm text-zinc-400">暂无图片</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {pictures[type].map((pic, index) => (
                      <div key={pic.id} className="relative group">
                        <div className="aspect-video rounded-lg overflow-hidden border border-zinc-200">
                          <img
                            src={pic.image_url}
                            alt={`${label} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            className="bg-red-600 p-1 rounded text-white text-xs hover:bg-red-700 shadow-sm"
                            onClick={() => handleDelete(type, pic.id)}
                            title="删除图片"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 space-y-1">
                          <div>排序: {pic.sort_order}</div>
                          {pic.brand_name && <div>品牌: {pic.brand_name}</div>}
                          {pic.series_name && <div>车系: {pic.series_name}</div>}
                          {pic.model_name && <div>车型: {pic.model_name}</div>}
                          {pic.brand_jm_id && <div>品牌 jm_id: {pic.brand_jm_id}</div>}
                          {pic.series_jm_id && <div>车系 jm_id: {pic.series_jm_id}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
          <div className="text-sm text-zinc-500">请选择车型后配置资源</div>
        </div>
      )) : null}

      {activeTab === 'db-view' ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-zinc-900">展示资源配置 - 数据库视图</h2>
              <div className="text-sm text-zinc-600">
                {selectedModelDb ? `当前筛选：车型 jm_id = ${selectedModelDb.jm_id}` : '当前筛选：全部'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => loadDbPictures()}
              disabled={dbPicturesLoading || commitBusy}
              className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50"
            >
              {dbPicturesLoading ? '加载中...' : '刷新'}
            </button>
          </div>

          <StagedCrudToolbar
            title="car_pictures"
            stagedItems={stagedItems.filter(it => it.tableName === 'car_pictures')}
            busy={commitBusy}
            onAdd={addNewRow}
            onDiscardAll={discardAll}
            onConfirm={commitStaged}
          />

          <BatchOperations
            tableName="car_pictures"
            selectedIds={selectedIds}
            totalCount={viewPictures.length}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onBatchUpdate={handleBatchUpdate}
            loading={dbPicturesLoading || commitBusy}
          />

          <BulkEditBar
            tableName="car_pictures"
            selectedIds={selectedIds}
            rows={viewPictures}
            fields={carPicturesFields}
            busy={dbPicturesLoading || commitBusy}
            getLabel={getCarPicturesLabel}
            getRowId={(row) => (row as any).id}
            isRowDeleted={(id) => isRowDeleted(id)}
            onClearSelection={handleClearSelection}
            onStageUpdate={stageUpdate}
            onToggleDeleteRow={toggleDeleteRow}
            onAddRow={addNewRow}
          />

          {error ? (
            <div className={`mb-4 p-4 rounded-lg ${error.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {error}
            </div>
          ) : null}

          <div className="max-h-[70vh] overflow-auto rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50 sticky top-0">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">选择</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">ID</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">model_jm_id</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">category</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">image_url</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">sort_order</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">状态</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">车型信息</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">updated_at</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {dbPicturesLoading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-sm text-zinc-500">加载中...</td>
                  </tr>
                ) : viewPictures.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-sm text-zinc-500">暂无数据</td>
                  </tr>
                ) : (
                  viewPictures.map((row) => {
                    const deleted = isRowDeleted(row.id);
                    const checked = selectedIds.includes(row.id);
                    const busy = commitBusy || dbPicturesLoading;
                    return (
                      <tr key={row.id} className={deleted ? 'bg-red-50/40' : 'hover:bg-zinc-50'}>
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                            checked={checked}
                            disabled={busy || deleted}
                            onChange={(e) => {
                              const next = e.target.checked;
                              setSelectedIds(prev => (next ? [...prev, row.id] : prev.filter(id => id !== row.id)));
                            }}
                          />
                        </td>
                        <td className="px-3 py-3 text-sm text-zinc-700 whitespace-nowrap">
                          {row.id.startsWith('tmp_') ? '临时' : row.id.slice(0, 8)}
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            value={row.model_jm_id ?? 0}
                            disabled={busy || deleted}
                            onChange={(e) => stageUpdate(row.id, 'model_jm_id', Number(e.target.value || 0))}
                            className="w-32 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 disabled:bg-zinc-50"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={row.category}
                            disabled={busy || deleted}
                            onChange={(e) => stageUpdate(row.id, 'category', e.target.value)}
                            className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 disabled:bg-zinc-50"
                          >
                            {resourceTypes.map(rt => (
                              <option key={rt.type} value={rt.type}>{rt.type}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={row.image_url ?? ''}
                              disabled={busy || deleted}
                              onChange={(e) => stageUpdate(row.id, 'image_url', e.target.value)}
                              className="w-[420px] max-w-[42vw] rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 disabled:bg-zinc-50"
                            />
                            {row.image_url ? (
                              <a
                                href={row.image_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
                              >
                                预览
                              </a>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            value={row.sort_order ?? 0}
                            disabled={busy || deleted}
                            onChange={(e) => stageUpdate(row.id, 'sort_order', Number(e.target.value || 0))}
                            className="w-24 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 disabled:bg-zinc-50"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <select
                              value={Number(row.activity_status ?? 0)}
                              disabled={busy || deleted}
                              onChange={(e) => stageUpdate(row.id, 'activity_status', Number(e.target.value))}
                              className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 disabled:bg-zinc-50"
                            >
                              <option value={0}>正常</option>
                              <option value={1}>不显示</option>
                              <option value={2}>不可用</option>
                            </select>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActivityStatusColor(Number(row.activity_status ?? 0))}`}>
                              {getActivityStatusLabel(Number(row.activity_status ?? 0))}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-zinc-700">
                          <div className="space-y-1">
                            <div className="truncate">{row.brand_name || '-'}</div>
                            <div className="truncate">{row.series_name || '-'}</div>
                            <div className="truncate">{row.model_name || '-'}</div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sm text-zinc-600 whitespace-nowrap">{row.updated_at ? new Date(row.updated_at).toLocaleString() : '-'}</td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => toggleDeleteRow(row.id)}
                            className={`rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-50 ${
                              deleted
                                ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            {deleted ? '撤销删除' : '删除'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
