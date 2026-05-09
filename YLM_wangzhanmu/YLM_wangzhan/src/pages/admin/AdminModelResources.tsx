import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";

// 资源类型定义
type ResourceType = 'vr_exterior' | 'vr_interior' | 'official' | 'exterior' | 'interior';

// 资源类型配置
const resourceTypes: { type: ResourceType; label: string; keywords: string[] }[] = [
  { type: 'vr_exterior', label: '外观VR图集', keywords: ['外观vr', 'vr外观', 'vr_exterior', 'exteriorvr', '外观-vr'] },
  { type: 'vr_interior', label: '内饰VR图集', keywords: ['内饰vr', 'vr内饰', 'vr_interior', 'interiorvr', '内饰-vr'] },
  { type: 'official', label: '官方图集', keywords: ['官图', '官方', 'official', 'officials'] },
  { type: 'exterior', label: '外观图集', keywords: ['外观', 'exterior', 'outsides', 'outside'] },
  { type: 'interior', label: '内饰图集', keywords: ['内饰', 'interior', 'insides', 'inside'] },
];

// 文件夹分类映射
const mapFolderToResourceType = (folderName: string): ResourceType | null => {
  const normalized = folderName.toLowerCase().trim();
  for (const rt of resourceTypes) {
    if (rt.keywords.some(keyword => normalized.includes(keyword))) {
      return rt.type;
    }
  }
  return null;
};

// 图片资源类型
type ImageResource = {
  id: string;
  model_id: string;
  model_jm_id: number;
  series_id: string;
  series_jm_id: number;
  brand_id: string;
  brand_jm_id: number;
  resource_type: ResourceType;
  image_url: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};

// 品牌类型
type DbBrand = {
  id: string;
  jm_id: number;
  name: string;
  initial: string | null;
  logo_url: string | null;
  parent_id: number;
  depth: number;
  created_at: string;
  updated_at: string;
};

// 车系类型
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
  created_at: string;
  updated_at: string;
};

// 车型类型
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

export default function AdminModelResources() {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  
  // 资源管理状态
  const [resources, setResources] = useState<Record<ResourceType, ImageResource[]>>({  
    vr_exterior: [],
    vr_interior: [],
    official: [],
    exterior: [],
    interior: []
  });
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

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

  // 加载车型资源
  async function loadModelResources() {
    if (!selectedModelDb) {
      setResources({
        vr_exterior: [],
        vr_interior: [],
        official: [],
        exterior: [],
        interior: []
      });
      return;
    }
    
    setResourcesLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('model_resources')
        .select('*')
        .eq('model_jm_id', selectedModelDb.jm_id)
        .order('resource_type, order_index');
      
      if (error) {
        // 如果表不存在，创建表
        if (error.message?.includes('does not exist')) {
          await createModelResourcesTable();
          setResources({
            vr_exterior: [],
            vr_interior: [],
            official: [],
            exterior: [],
            interior: []
          });
        } else {
          throw error;
        }
      } else {
        // 按资源类型分组
        const grouped: Record<ResourceType, ImageResource[]> = {
          vr_exterior: [],
          vr_interior: [],
          official: [],
          exterior: [],
          interior: []
        };
        
        (data || []).forEach(resource => {
          grouped[resource.resource_type].push(resource);
        });
        
        setResources(grouped);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载车型资源失败');
    } finally {
      setResourcesLoading(false);
    }
  }

  // 创建车型资源表
  async function createModelResourcesTable() {
    try {
      await supabase.rpc('create_model_resources_table');
    } catch (error) {
      console.error('创建车型资源表失败:', error);
    }
  }

  // 筛选品牌
  const filteredBrands = brandSearchQuery.trim() === ""
    ? dbBrands
    : dbBrands.filter(brand => 
        brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase())
      );

  // 筛选车系
  const filteredSeries = seriesSearchQuery.trim() === ""
    ? dbSeries
    : dbSeries.filter(series => 
        series.name.toLowerCase().includes(seriesSearchQuery.toLowerCase())
      );

  // 筛选车型
  const filteredModels = modelSearchQuery.trim() === ""
    ? dbModels
    : dbModels.filter(model => 
        model.name.toLowerCase().includes(modelSearchQuery.toLowerCase())
      );

  // 品牌选择变化
  useEffect(() => {
    if (selectedBrandId) {
      loadDbSeries();
      setSelectedSeriesId(null);
      setSelectedModelId(null);
      setSelectedSeriesDb(null);
      setSelectedModelDb(null);
      setResources({
        vr_exterior: [],
        vr_interior: [],
        official: [],
        exterior: [],
        interior: []
      });
    }
  }, [selectedBrandId]);

  // 车系选择变化
  useEffect(() => {
    if (selectedSeriesId) {
      loadDbModels();
      setSelectedModelId(null);
      setSelectedModelDb(null);
      setResources({
        vr_exterior: [],
        vr_interior: [],
        official: [],
        exterior: [],
        interior: []
      });
    }
  }, [selectedSeriesId]);

  // 车型选择变化
  useEffect(() => {
    if (selectedModelId) {
      const model = dbModels.find(m => m.jm_id === selectedModelId);
      if (model) {
        setSelectedModelDb(model);
        loadModelResources();
      }
    }
  }, [selectedModelId, dbModels]);

  // 初始加载品牌
  useEffect(() => {
    loadDbBrands();
  }, []);

  // 文件夹上传进度状态
  const [folderUploadProgress, setFolderUploadProgress] = useState<{
    total: number;
    current: number;
    currentType: string;
  } | null>(null);

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
      // 按文件夹/分类分组文件
      const groupedFiles: Record<ResourceType, File[]> = {
        vr_exterior: [],
        vr_interior: [],
        official: [],
        exterior: [],
        interior: []
      };

      // 分析文件路径，按文件夹分类
      for (const file of files) {
        // webkitRelativePath 包含完整路径，例如 "车型文件夹/官图/1.jpg"
        const path = file.webkitRelativePath || file.name;
        const pathParts = path.split('/');

        // 查找可能的分类文件夹名（通常在最后一个部分前）
        let resourceType: ResourceType | null = null;
        for (let i = pathParts.length - 2; i >= 0; i--) {
          resourceType = mapFolderToResourceType(pathParts[i]);
          if (resourceType) break;
        }

        // 如果找不到分类，尝试从文件名中识别
        if (!resourceType) {
          resourceType = mapFolderToResourceType(file.name);
        }

        // 默认放到官方图集中
        if (!resourceType) {
          resourceType = 'official';
        }

        groupedFiles[resourceType].push(file);
      }

      // 逐个分类上传
      for (const [resourceType, typeFiles] of Object.entries(groupedFiles)) {
        if (typeFiles.length === 0) continue;

        const rt = resourceType as ResourceType;
        const typeLabel = resourceTypes.find(r => r.type === rt)?.label || rt;
        setFolderUploadProgress(prev => prev ? { ...prev, currentType: typeLabel } : null);

        // 计算当前分类的起始索引
        const currentResources = resources[rt];
        let orderIndex = currentResources.length > 0
          ? Math.max(...currentResources.map(r => r.order_index)) + 1
          : 0;

        const uploadedImages: ImageResource[] = [];

        for (let i = 0; i < typeFiles.length; i++) {
          const file = typeFiles[i];

          // 生成文件名
          const fileName = `model_${selectedModelDb.jm_id}_${rt}_${Date.now()}_${i}.${file.name.split('.').pop()}`;

          // 上传到 Supabase Storage
          const { error: uploadError } = await supabase
            .storage
            .from('model-images')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          // 获取公共 URL
          const { data: urlData } = supabase
            .storage
            .from('model-images')
            .getPublicUrl(fileName);

          if (!urlData.publicUrl) throw new Error('获取图片 URL 失败');

          // 保存到数据库
          const { data: resourceData, error: dbError } = await supabase
            .from('model_resources')
            .insert({
              model_id: selectedModelDb.id,
              model_jm_id: selectedModelDb.jm_id,
              series_id: selectedModelDb.series_id,
              series_jm_id: selectedModelDb.series_jm_id,
              brand_id: selectedModelDb.brand_id,
              brand_jm_id: selectedModelDb.brand_jm_id,
              resource_type: rt,
              image_url: urlData.publicUrl,
              order_index: orderIndex++
            })
            .select()
            .single();

          if (dbError) throw dbError;

          uploadedImages.push(resourceData);

          // 更新进度
          const processedSoFar = Object.values(groupedFiles).reduce((sum, arr, idx) => {
            if (idx < Object.keys(groupedFiles).indexOf(resourceType)) return sum + arr.length;
            if (idx === Object.keys(groupedFiles).indexOf(resourceType)) return sum + i + 1;
            return sum;
          }, 0);
          setUploadProgress(Math.round((processedSoFar / files.length) * 100));
          setFolderUploadProgress(prev => prev ? { ...prev, current: processedSoFar } : null);
        }

        // 更新该分类的资源列表
        setResources(prev => ({
          ...prev,
          [rt]: [...prev[rt], ...uploadedImages].sort((a, b) => a.order_index - b.order_index)
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

  // 处理文件上传
  const handleFileUpload = async (resourceType: ResourceType, files: File[]) => {
    if (!selectedModelDb) {
      setError('请先选择车型');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      const uploadedImages: ImageResource[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 生成文件名
        const fileName = `model_${selectedModelDb.jm_id}_${resourceType}_${Date.now()}_${i}.${file.name.split('.').pop()}`;
        
        // 上传到 Supabase Storage
        const { data, error: uploadError } = await supabase
          .storage
          .from('model-images')
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        // 获取公共 URL
        const { data: urlData } = supabase
          .storage
          .from('model-images')
          .getPublicUrl(fileName);
        
        if (!urlData.publicUrl) throw new Error('获取图片 URL 失败');
        
        // 计算排序索引
        const currentResources = resources[resourceType];
        const orderIndex = currentResources.length > 0 
          ? Math.max(...currentResources.map(r => r.order_index)) + 1 
          : 0;
        
        // 保存到数据库
        const { data: resourceData, error: dbError } = await supabase
          .from('model_resources')
          .insert({
            model_id: selectedModelDb.id,
            model_jm_id: selectedModelDb.jm_id,
            series_id: selectedModelDb.series_id,
            series_jm_id: selectedModelDb.series_jm_id,
            brand_id: selectedModelDb.brand_id,
            brand_jm_id: selectedModelDb.brand_jm_id,
            resource_type: resourceType,
            image_url: urlData.publicUrl,
            order_index: orderIndex
          })
          .select()
          .single();
        
        if (dbError) throw dbError;
        
        uploadedImages.push(resourceData);
        
        // 更新进度
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }
      
      // 更新资源列表
      setResources(prev => ({
        ...prev,
        [resourceType]: [...prev[resourceType], ...uploadedImages].sort((a, b) => a.order_index - b.order_index)
      }));
      
    } catch (e) {
      setError(e instanceof Error ? e.message : '上传失败');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // 处理图片删除
  const handleImageDelete = async (resourceType: ResourceType, resourceId: string) => {
    if (!selectedModelDb) return;
    
    try {
      // 从数据库删除
      const { error } = await supabase
        .from('model_resources')
        .delete()
        .eq('id', resourceId);
      
      if (error) throw error;
      
      // 更新资源列表
      setResources(prev => ({
        ...prev,
        [resourceType]: prev[resourceType].filter(r => r.id !== resourceId)
      }));
      
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败');
    }
  };

  // 处理图片排序
  const handleImageReorder = async (resourceType: ResourceType, fromIndex: number, toIndex: number) => {
    if (!selectedModelDb) return;
    
    try {
      const updatedResources = [...resources[resourceType]];
      const [movedResource] = updatedResources.splice(fromIndex, 1);
      updatedResources.splice(toIndex, 0, movedResource);
      
      // 更新排序索引
      for (let i = 0; i < updatedResources.length; i++) {
        const { error } = await supabase
          .from('model_resources')
          .update({ order_index: i })
          .eq('id', updatedResources[i].id);
        
        if (error) throw error;
      }
      
      // 更新资源列表
      setResources(prev => ({
        ...prev,
        [resourceType]: updatedResources
      }));
      
    } catch (e) {
      setError(e instanceof Error ? e.message : '排序失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 车型选择 */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">车型选择</h2>

        {/* 品牌、车系、车型选择水平排列 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 品牌选择 */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">品牌</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={brandSearchQuery}
                onChange={(e) => setBrandSearchQuery(e.target.value)}
                placeholder="搜索品牌"
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2">
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
            <label className="block text-sm font-medium text-zinc-700 mb-1">车系</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={seriesSearchQuery}
                onChange={(e) => setSeriesSearchQuery(e.target.value)}
                placeholder="搜索车系"
                disabled={!selectedBrandId}
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2">
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
            <label className="block text-sm font-medium text-zinc-700 mb-1">车型</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={modelSearchQuery}
                onChange={(e) => setModelSearchQuery(e.target.value)}
                placeholder="搜索车型"
                disabled={!selectedSeriesId}
                className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-zinc-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2">
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
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="text-sm text-green-800">
              <div><strong>品牌:</strong> {selectedBrandDb?.name}</div>
              <div><strong>车系:</strong> {selectedSeriesDb?.name}</div>
              <div><strong>车型:</strong> {selectedModelDb.name}</div>
            </div>
          </div>
        )}
      </div>

      {/* 资源配置 */}
      {selectedModelDb ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">展示资源配置</h2>

          {/* 文件夹上传功能 */}
          <div className="mb-6 rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 p-6">
            <h3 className="text-md font-semibold text-zinc-900 mb-2">文件夹批量上传</h3>
            <p className="text-sm text-zinc-600 mb-4">
              支持上传整个车型文件夹，自动识别子文件夹分类（外观VR、内饰VR、官图等）
            </p>
            <div className="relative">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <span>选择车型文件夹</span>
              </button>
              <input
                type="file"
                // @ts-ignore 类型断言，忽略 webkitdirectory 属性的类型错误
                webkitdirectory="true"
                directory="true"
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
            {/* 文件夹上传进度 */}
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
          </div>
          
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          
          {uploading && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="text-sm text-blue-800">上传中... {uploadProgress}%</div>
              <div className="mt-2 h-2 rounded-full bg-blue-100">
                <div 
                  className="h-full rounded-full bg-blue-500 transition-all" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* 资源类型列表 */}
          <div className="space-y-6">
            {resourceTypes.map(({ type, label }) => (
              <div key={type} className="border border-zinc-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-zinc-900">{label}</h3>
                  
                  {/* 上传按钮 */}
                  <div className="relative">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      <span>上传图片</span>
                    </button>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          handleFileUpload(type, files);
                        }
                      }}
                    />
                  </div>
                </div>
                
                {/* 图片列表 */}
                {resourcesLoading ? (
                  <div className="text-sm text-zinc-500">加载中...</div>
                ) : resources[type].length === 0 ? (
                  <div className="text-sm text-zinc-400">暂无图片</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resources[type].map((resource, index) => (
                      <div key={resource.id} className="relative group">
                        <div className="aspect-video rounded-lg overflow-hidden border border-zinc-200">
                          <img 
                            src={resource.image_url} 
                            alt={`${label} ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* 排序按钮 */}
                          {index > 0 && (
                            <button
                              type="button"
                              className="rounded bg-black/50 p-1 text-white text-xs hover:bg-black/70"
                              onClick={() => handleImageReorder(type, index, index - 1)}
                            >
                              ↑
                            </button>
                          )}
                          {index < resources[type].length - 1 && (
                            <button
                              type="button"
                              className="rounded bg-black/50 p-1 text-white text-xs hover:bg-black/70"
                              onClick={() => handleImageReorder(type, index, index + 1)}
                            >
                              ↓
                            </button>
                          )}
                          {/* 删除按钮 */}
                          <button
                            type="button"
                            className="rounded bg-red-600 p-1 text-white text-xs hover:bg-red-700"
                            onClick={() => handleImageDelete(type, resource.id)}
                          >
                            ×
                          </button>
                        </div>
                        <div className="mt-2 text-xs text-zinc-500">
                          排序: {resource.order_index + 1}
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
      )}
    </div>
  );
}
