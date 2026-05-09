import type { JobStage } from './api'

export function stageLabel(stage: JobStage): string {
  switch (stage) {
    case 'init':
      return '初始化'
    case 'resolve_series':
      return '解析车系信息'
    case 'collect_links':
      return '获取分类入口'
    case 'collect_images':
      return '收集图片链接'
    case 'download_images':
      return '下载图片'
    case 'collect_vr':
      return '收集 360VR 链接'
    case 'download_vr':
      return '下载 360VR'
    case 'done':
      return '完成'
    default:
      return stage
  }
}
