import express from 'express';
import cors from 'cors';
import { supabase } from './supabase.js';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 配置 - 允许前端访问
const corsOptions = {
  origin: '*', // 允许所有域名（开发环境）
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // 支持大文件上传

// 健康检查
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== 分类管理 ====================

// 获取所有分类
app.get('/api/categories', async (_, res) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('id');
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 创建分类
app.post('/api/categories', async (req, res) => {
  const { name, description } = req.body;
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, description }])
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 更新分类
app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const { data, error } = await supabase
    .from('categories')
    .update({ name, description })
    .eq('id', id)
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 删除分类
app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ==================== 系列管理 ====================

// 获取所有系列
app.get('/api/series', async (_, res) => {
  const { data, error } = await supabase
    .from('series')
    .select('*')
    .order('id');
  
  if (error) return res.status(500).json({ error: error.message });
  // 转换 category_id 为 categoryId
  const result = data.map(item => ({
    id: item.id,
    categoryId: item.category_id,
    name: item.name,
    description: item.description,
    keywords: item.keywords || []
  }));
  res.json(result);
});

// 创建系列
app.post('/api/series', async (req, res) => {
  const { categoryId, name, description, keywords } = req.body;
  const { data, error } = await supabase
    .from('series')
    .insert([{ category_id: categoryId, name, description, keywords }])
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({
    id: data.id,
    categoryId: data.category_id,
    name: data.name,
    description: data.description,
    keywords: data.keywords || []
  });
});

// 更新系列
app.put('/api/series/:id', async (req, res) => {
  const { id } = req.params;
  const { categoryId, name, description, keywords } = req.body;
  const { data, error } = await supabase
    .from('series')
    .update({ category_id: categoryId, name, description, keywords })
    .eq('id', id)
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({
    id: data.id,
    categoryId: data.category_id,
    name: data.name,
    description: data.description,
    keywords: data.keywords || []
  });
});

// 删除系列
app.delete('/api/series/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('series')
    .delete()
    .eq('id', id);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ==================== 产品管理 ====================

// 获取所有产品
app.get('/api/products', async (_, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id');
  
  if (error) return res.status(500).json({ error: error.message });
  // 转换 series_id 为 seriesId, category_id 为 categoryId
  const result = data.map(item => ({
    id: item.id,
    seriesId: item.series_id,
    categoryId: item.category_id,
    name: item.name,
    specs: item.specs || {},
    image: item.image
  }));
  res.json(result);
});

// 获取单个产品
app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({
    id: data.id,
    seriesId: data.series_id,
    categoryId: data.category_id,
    name: data.name,
    specs: data.specs || {},
    image: data.image
  });
});

// 创建产品
app.post('/api/products', async (req, res) => {
  const { seriesId, categoryId, name, specs, image } = req.body;
  const { data, error } = await supabase
    .from('products')
    .insert([{ 
      series_id: seriesId, 
      category_id: categoryId, 
      name, 
      specs: specs || {}, 
      image 
    }])
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({
    id: data.id,
    seriesId: data.series_id,
    categoryId: data.category_id,
    name: data.name,
    specs: data.specs || {},
    image: data.image
  });
});

// 更新产品
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { seriesId, categoryId, name, specs, image } = req.body;
  const { data, error } = await supabase
    .from('products')
    .update({ 
      series_id: seriesId, 
      category_id: categoryId, 
      name, 
      specs: specs || {}, 
      image 
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({
    id: data.id,
    seriesId: data.series_id,
    categoryId: data.category_id,
    name: data.name,
    specs: data.specs || {},
    image: data.image
  });
});

// 删除产品
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ==================== 产品规格设置管理 ====================

// 获取产品规格设置
app.get('/api/spec-settings/:productId', async (req, res) => {
  const { productId } = req.params;
  const { data, error } = await supabase
    .from('spec_settings')
    .select('*')
    .eq('product_id', productId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    return res.status(500).json({ error: error.message });
  }
  res.json(data || null);
});

// 保存产品规格设置
app.post('/api/spec-settings', async (req, res) => {
  const { productId, logoUrl, productImage, dimensionImage, certifications, footer, editableSpecs, photometricRows, moduleCustomSpecs, hasControlSystem } = req.body;
  
  // 检查是否已存在
  const { data: existing } = await supabase
    .from('spec_settings')
    .select('id')
    .eq('product_id', productId)
    .single();
  
  let result;
  if (existing) {
    // 更新
    result = await supabase
      .from('spec_settings')
      .update({ 
        logo_url: logoUrl, 
        product_image: productImage, 
        dimension_image: dimensionImage, 
        certifications, 
        footer, 
        editable_specs: editableSpecs, 
        photometric_rows: photometricRows, 
        module_custom_specs: moduleCustomSpecs, 
        has_control_system: hasControlSystem 
      })
      .eq('product_id', productId)
      .select()
      .single();
  } else {
    // 新建
    result = await supabase
      .from('spec_settings')
      .insert([{ 
        product_id: productId, 
        logo_url: logoUrl, 
        product_image: productImage, 
        dimension_image: dimensionImage, 
        certifications, 
        footer, 
        editable_specs: editableSpecs, 
        photometric_rows: photometricRows, 
        module_custom_specs: moduleCustomSpecs, 
        has_control_system: hasControlSystem 
      }])
      .select()
      .single();
  }
  
  if (result.error) return res.status(500).json({ error: result.error.message });
  res.json(result.data);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
