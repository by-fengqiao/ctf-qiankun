import type { ToolDefinition } from '../../types';
export default {
  id: 'exif-geolocation',
  name: 'EXIF 地理定位',
  description: '从 JPEG/EXIF 中提取 GPS 坐标（经纬度/海拔）并生成 Google Maps 链接',
  category: 'osint',
  group: '文件/邮件',
  keywords: ['exif', 'gps', 'geo', 'geolocation', 'jpeg', '坐标', '定位', '海拔', '经纬度'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: 'FFD8FFE1...',
} satisfies ToolDefinition;
