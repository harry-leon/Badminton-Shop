'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdmin } from '@/lib/admin-context';
import {
  PackageOpen,
  Search,
  Filter,
  Plus,
  Edit2,
  Boxes,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Tag,
  ShieldCheck,
  Power,
  ChevronRight,
  Trash2,
  X,
  Image as ImageIcon,
  SlidersHorizontal,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import ImageUpload from '@/components/ui/ImageUpload';
import { resolveImageKitUrl } from '@/components/ui/SafeImage';

export interface GalleryImage {
  id: string;
  angle: 'FRONT' | 'BACK' | 'SIDE' | 'HEAD' | 'THROAT' | 'GRIP' | 'DETAIL';
  image_url: string;
  sort_order: number;
  is_primary: boolean;
}

interface SkuItem {
  id: string;
  price: number;
  weight: string;
  grip_size: string;
  variant_name?: string;
  color?: string;
  is_active: boolean;
  stock: {
    on_hand: number;
    reserved: number;
    available: number;
  };
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  brand_id: string;
  category_id: string;
  brand_name: string;
  category_name: string;
  image_url: string;
  is_active: boolean;
  warranty_months: number;
  play_style?: string;
  balance_category?: string;
  shaft_stiffness?: string;
  weight_classes?: string;
  grip_sizes?: string;
  max_tension_lbs?: number;
  length_mm?: number;
  level?: string;
  frame_shape?: string;
  description?: string;
  tags?: string[];
  skus: SkuItem[];
  gallery?: GalleryImage[];
  total_on_hand: number;
  total_reserved: number;
  total_available: number;
}

const BRANCH_NAMES: Record<string, string> = {
  ALL: 'Toàn quốc (Tất cả chi nhánh)',
  BR_HCM_01: 'Smash Court — Quận 1 (TP.HCM)',
  BR_HN_01: 'Smash Court — Cầu Giấy (Hà Nội)',
  BR_DN_01: 'Smash Court — Hải Châu (Đà Nẵng)',
};

function AdminProductsPageContent() {
  const { selectedBranch, user } = useAdmin();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [brandFilter, setBrandFilter] = useState('ALL');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingStockSku, setEditingStockSku] = useState<{
    productName: string;
    sku: SkuItem;
  } | null>(null);
  const [newStockQty, setNewStockQty] = useState<number>(0);
  const [stockReason, setStockReason] = useState('');
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  // Form Create State
  const [newName, setNewName] = useState('');
  const [newBrand, setNewBrand] = useState('yonex');
  const [newCategory, setNewCategory] = useState('cat_racket');
  const [newPrice, setNewPrice] = useState('2500000');
  const [newSkuCode, setNewSkuCode] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newInitialStock, setNewInitialStock] = useState('10');
  const [newPlayStyle, setNewPlayStyle] = useState('Công thủ toàn diện');
  const [newBalance, setNewBalance] = useState('Cân bằng');
  const [newStiffness, setNewStiffness] = useState('Trung bình');
  const [newWeightClasses, setNewWeightClasses] = useState('3U, 4U');
  const [newGripSizes, setNewGripSizes] = useState('G5');
  const [newMaxTension, setNewMaxTension] = useState('30');
  const [newLengthMm, setNewLengthMm] = useState('675');
  const [newLevel, setNewLevel] = useState('Chuyên nghiệp');
  const [newFrameShape, setNewFrameShape] = useState('ISOMETRIC');
  const [newWarrantyMonths, setNewWarrantyMonths] = useState('12');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Form Edit State
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('yonex');
  const [editCategory, setEditCategory] = useState('cat_racket');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPlayStyle, setEditPlayStyle] = useState('Công thủ toàn diện');
  const [editBalance, setEditBalance] = useState('Cân bằng');
  const [editStiffness, setEditStiffness] = useState('Trung bình');
  const [editWeightClasses, setEditWeightClasses] = useState('3U, 4U');
  const [editGripSizes, setEditGripSizes] = useState('G5');
  const [editMaxTension, setEditMaxTension] = useState('30');
  const [editLengthMm, setEditLengthMm] = useState('675');
  const [editLevel, setEditLevel] = useState('Chuyên nghiệp');
  const [editFrameShape, setEditFrameShape] = useState('ISOMETRIC');
  const [editWarrantyMonths, setEditWarrantyMonths] = useState('12');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);

  // Tab đang chọn trong Unified Modal: 'INFO' | 'STOCK' | 'GALLERY' | 'SKU'
  const [activeActionTab, setActiveActionTab] = useState<'INFO' | 'STOCK' | 'GALLERY' | 'SKU'>('INFO');

  // Modal Gallery Images
  const [galleryProduct, setGalleryProduct] = useState<ProductItem | null>(null);
  const [selectedAngle, setSelectedAngle] = useState<'FRONT' | 'BACK' | 'SIDE' | 'HEAD' | 'THROAT' | 'GRIP' | 'DETAIL'>('FRONT');
  const [galleryImageUrl, setGalleryImageUrl] = useState('');
  const [isPrimaryImage, setIsPrimaryImage] = useState(false);
  const [savingImage, setSavingImage] = useState(false);

  // Modal Add SKU
  const [skuProduct, setSkuProduct] = useState<ProductItem | null>(null);
  const [addSkuCode, setAddSkuCode] = useState('');
  const [addSkuPrice, setAddSkuPrice] = useState('2500000');
  const [addSkuWeight, setAddSkuWeight] = useState('4U');
  const [addSkuGrip, setAddSkuGrip] = useState('G5');
  const [addSkuColor, setAddSkuColor] = useState('Tiêu chuẩn');
  const [addSkuStock, setAddSkuStock] = useState('10');
  const [submittingSku, setSubmittingSku] = useState(false);

  // Taxonomy & Tags states
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [productTab, setProductTab] = useState<'PRODUCTS' | 'TAXONOMY' | 'TAGS'>(() => {
    if (urlTab === 'TAXONOMY' || urlTab === 'TAGS') return urlTab;
    return 'PRODUCTS';
  });

  useEffect(() => {
    if (urlTab === 'TAXONOMY' || urlTab === 'TAGS') {
      setProductTab(urlTab);
    } else if (urlTab === 'PRODUCTS' || !urlTab) {
      setProductTab('PRODUCTS');
    }
  }, [urlTab]);
  const [dbBrands, setDbBrands] = useState<any[]>([]);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [availableTags, setAvailableTags] = useState<any[]>([]);

  // Tag Manager State
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagCode, setTagCode] = useState('');
  const [tagName, setTagName] = useState('');
  const [tagBgColor, setTagBgColor] = useState('#DC2626');
  const [tagTextColor, setTagTextColor] = useState('#FFFFFF');
  const [tagIcon, setTagIcon] = useState('Tag');
  const [tagSortOrder, setTagSortOrder] = useState('1');
  const [editingTagItem, setEditingTagItem] = useState<any | null>(null);
  const [savingTag, setSavingTag] = useState(false);

  // Brand modal
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [brandId, setBrandId] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandCountry, setBrandCountry] = useState('Nhật Bản');
  const [brandDesc, setBrandDesc] = useState('');
  const [editingBrandItem, setEditingBrandItem] = useState<any | null>(null);
  const [savingBrand, setSavingBrand] = useState(false);

  // Category modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catId, setCatId] = useState('');
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [editingCatItem, setEditingCatItem] = useState<any | null>(null);
  const [savingCat, setSavingCat] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const branchParam = selectedBranch ? `?branch_id=${selectedBranch}` : '';
      const res = await fetch(`/api/admin/products${branchParam}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tải danh mục sản phẩm');
      setProducts(data.products || []);
      setDbBrands(data.brands || []);
      setDbCategories(data.categories || []);
      setAvailableTags(data.available_tags || []);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/admin/tags');
      const data = await res.json();
      if (data.tags) setAvailableTags(data.tags);
    } catch {}
  };

  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTag(true);
    try {
      const action = editingTagItem ? 'UPDATE' : 'CREATE';
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          tag: {
            id: editingTagItem?.id,
            code: tagCode,
            name: tagName,
            bg_color: tagBgColor,
            text_color: tagTextColor,
            icon_name: tagIcon,
            sort_order: parseInt(tagSortOrder, 10) || 0,
            is_active: true,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lưu tag thất bại');
      toast.success(editingTagItem ? 'Cập nhật tag thành công!' : 'Tạo tag mới thành công!');
      setTagModalOpen(false);
      setEditingTagItem(null);
      setTagCode('');
      setTagName('');
      setTagBgColor('#DC2626');
      setTagTextColor('#FFFFFF');
      if (data.tags) setAvailableTags(data.tags);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingTag(false);
    }
  };

  const handleDeleteTag = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa tag "${name}"?`)) return;
    try {
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE', tagId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xóa tag thất bại');
      toast.success('Đã xóa tag thành công!');
      if (data.tags) setAvailableTags(data.tags);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleToggleTag = async (id: string) => {
    try {
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_ACTIVE', tagId: id }),
      });
      const data = await res.json();
      if (data.tags) setAvailableTags(data.tags);
      toast.success('Đã thay đổi trạng thái tag!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBrand(true);
    try {
      const action = editingBrandItem ? 'UPDATE_BRAND' : 'CREATE_BRAND';
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          id: brandId,
          name: brandName,
          country: brandCountry,
          description: brandDesc,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lưu thương hiệu thất bại');
      toast.success(data.message);
      setBrandModalOpen(false);
      setEditingBrandItem(null);
      setBrandId('');
      setBrandName('');
      setBrandCountry('Nhật Bản');
      setBrandDesc('');
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingBrand(false);
    }
  };

  const handleDeleteBrand = async (bId: string) => {
    if (!confirm(`Bạn có chắc muốn xóa thương hiệu "${bId}"?`)) return;
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_BRAND', id: bId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xóa thất bại');
      toast.success(data.message);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCat(true);
    try {
      const action = editingCatItem ? 'UPDATE_CATEGORY' : 'CREATE_CATEGORY';
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          id: catId,
          name: catName,
          slug: catSlug,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lưu danh mục thất bại');
      toast.success(data.message);
      setCatModalOpen(false);
      setEditingCatItem(null);
      setCatId('');
      setCatName('');
      setCatSlug('');
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (cId: string) => {
    if (!confirm(`Bạn có chắc muốn xóa danh mục "${cId}"?`)) return;
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_CATEGORY', id: cId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xóa thất bại');
      toast.success(data.message);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    fetchProducts();
    const handlePortalRefresh = () => fetchProducts();
    window.addEventListener('portal-refresh', handlePortalRefresh);
    return () => window.removeEventListener('portal-refresh', handlePortalRefresh);
  }, [selectedBranch]);

  // Handler cập nhật tồn kho chi nhánh (Dành cho cả ADMIN và MANAGER theo scoping)
  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStockSku) return;

    // Chi nhánh thao tác
    const targetBranch = user?.role === 'BRANCH_MANAGER' ? user.branch_id : selectedBranch === 'ALL' ? 'BR_HN_01' : selectedBranch;

    if (!targetBranch || targetBranch === 'ALL') {
      toast.error('Vui lòng chọn cụ thể một chi nhánh trong thanh điều hướng để điều chỉnh tồn kho.');
      return;
    }

    setIsUpdatingStock(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_BRANCH_STOCK',
          branch_id: targetBranch,
          sku: editingStockSku.sku.id,
          new_on_hand: newStockQty,
          reason: stockReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cập nhật thất bại.');

      toast.success(data.message || 'Đã cập nhật tồn kho thành công!');
      setEditingStockSku(null);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const handleSaveImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryProduct || !galleryImageUrl) {
      toast.error('Vui lòng chọn hoặc dán đường dẫn hình ảnh');
      return;
    }

    setSavingImage(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_PRODUCT_IMAGE',
          product_id: galleryProduct.id,
          angle: selectedAngle,
          image_url: galleryImageUrl,
          sort_order: ['FRONT', 'BACK', 'SIDE', 'HEAD', 'THROAT', 'GRIP', 'DETAIL'].indexOf(selectedAngle) + 1,
          is_primary: isPrimaryImage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      setGalleryImageUrl('');
      setIsPrimaryImage(false);
      await fetchProducts();
      // Cập nhật lại galleryProduct trong modal
      const refreshed = await (await fetch(`/api/admin/products${selectedBranch ? `?branch_id=${selectedBranch}` : ''}`)).json();
      const updated = refreshed?.products?.find((p: any) => p.id === galleryProduct.id);
      if (updated) setGalleryProduct(updated);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingImage(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Bạn có chắc muốn xóa ảnh này?')) return;
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_PRODUCT_IMAGE',
          image_id: imageId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      await fetchProducts();
      if (galleryProduct) {
        setGalleryProduct((prev) => prev ? {
          ...prev,
          gallery: prev.gallery?.filter((g) => g.id !== imageId)
        } : null);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddSku = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuProduct || !addSkuCode || !addSkuPrice) {
      toast.error('Vui lòng điền đủ mã SKU và giá bán.');
      return;
    }

    setSubmittingSku(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_SKU',
          product_id: skuProduct.id,
          sku_code: addSkuCode,
          price: parseInt(addSkuPrice, 10),
          weight: addSkuWeight,
          grip_size: addSkuGrip,
          color: addSkuColor,
          initial_stock: parseInt(addSkuStock, 10) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      setSkuProduct(null);
      setAddSkuCode('');
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingSku(false);
    }
  };

  // Handler tạo sản phẩm mới (ADMIN)
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPrice) {
      toast.error('Vui lòng nhập tên và giá sản phẩm.');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_PRODUCT',
          name: newName,
          brand_id: newBrand,
          category_id: newCategory,
          price: parseInt(newPrice, 10),
          sku_code: newSkuCode,
          image_url: newImageUrl,
          description: newDescription,
          initial_stock: parseInt(newInitialStock, 10) || 0,
          branch_id: selectedBranch,
          play_style: newPlayStyle,
          balance_category: newBalance,
          shaft_stiffness: newStiffness,
          weight_classes: newWeightClasses,
          grip_sizes: newGripSizes,
          max_tension_lbs: parseInt(newMaxTension, 10) || 30,
          length_mm: parseInt(newLengthMm, 10) || 675,
          level: newLevel,
          frame_shape: newFrameShape,
          warranty_months: parseInt(newWarrantyMonths, 10) || 12,
          tags: newTags,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tạo sản phẩm thất bại.');

      toast.success(data.message || 'Đã tạo sản phẩm thành công!');
      setIsCreateModalOpen(false);
      // Reset form
      setNewName('');
      setNewSkuCode('');
      setNewImageUrl('');
      setNewDescription('');
      setNewTags([]);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Handler mở Popup Quản Trị Toàn Diện Sản Phẩm (Unified Modal)
  const handleOpenEditModal = (p: ProductItem, defaultTab?: 'INFO' | 'STOCK' | 'GALLERY' | 'SKU') => {
    setEditingProduct(p);
    const initialTab = defaultTab || (user?.role === 'ADMIN' ? 'INFO' : 'STOCK');
    setActiveActionTab(initialTab);

    // 1. Dữ liệu Thông tin chung
    setEditName(p.name);
    setEditBrand(p.brand_id || 'yonex');
    setEditCategory(p.category_id || 'cat_racket');
    setEditImageUrl(p.image_url || '');
    setEditDescription(p.description || '');
    setEditPlayStyle(p.play_style || 'Công thủ toàn diện');
    setEditBalance(p.balance_category || 'Cân bằng');
    setEditStiffness(p.shaft_stiffness || 'Trung bình');
    setEditWeightClasses(p.weight_classes || '3U, 4U');
    setEditGripSizes(p.grip_sizes || 'G5');
    setEditMaxTension(p.max_tension_lbs?.toString() || '30');
    setEditLengthMm(p.length_mm?.toString() || '675');
    setEditLevel(p.level || 'Chuyên nghiệp');
    setEditFrameShape(p.frame_shape || 'ISOMETRIC');
    setEditWarrantyMonths(p.warranty_months?.toString() || '12');
    setEditTags(Array.isArray(p.tags) ? p.tags : []);

    // 2. Dữ liệu Tồn kho
    if (p.skus.length > 0) {
      setEditingStockSku({
        productName: p.name,
        sku: p.skus[0],
      });
      setNewStockQty(p.skus[0].stock.on_hand);
      setStockReason('');
    } else {
      setEditingStockSku(null);
    }

    // 3. Dữ liệu Gallery ảnh đa góc
    setGalleryProduct(p);
    setSelectedAngle('FRONT');
    setGalleryImageUrl('');
    setIsPrimaryImage(false);

    // 4. Dữ liệu Thêm SKU
    setSkuProduct(p);
    setAddSkuCode(`${p.slug.toUpperCase().slice(0, 12)}-${Date.now().toString().slice(-4)}`);
    setAddSkuPrice(p.skus[0]?.price?.toString() || '2500000');
    setAddSkuWeight('4U');
    setAddSkuGrip('G5');
    setAddSkuColor('Tiêu chuẩn');
    setAddSkuStock('10');
  };

  // Handler Lưu cập nhật sản phẩm (UPDATE) (ADMIN)
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsUpdatingProduct(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_PRODUCT',
          product_id: editingProduct.id,
          name: editName,
          brand_id: editBrand,
          category_id: editCategory,
          image_url: editImageUrl,
          description: editDescription,
          play_style: editPlayStyle,
          balance_category: editBalance,
          shaft_stiffness: editStiffness,
          weight_classes: editWeightClasses,
          grip_sizes: editGripSizes,
          max_tension_lbs: parseInt(editMaxTension, 10) || 30,
          length_mm: parseInt(editLengthMm, 10) || 675,
          level: editLevel,
          frame_shape: editFrameShape,
          warranty_months: parseInt(editWarrantyMonths, 10) || 12,
          tags: editTags,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cập nhật sản phẩm thất bại.');

      toast.success(data.message || 'Đã cập nhật sản phẩm thành công!');
      setEditingProduct(null);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  // Handler Xóa sản phẩm (DELETE) (ADMIN)
  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (user?.role !== 'ADMIN') {
      toast.error('Chỉ ADMIN mới có quyền xóa sản phẩm.');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm "${productName}" khỏi cơ sở dữ liệu?`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_PRODUCT',
          product_id: productId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xóa sản phẩm thất bại.');

      toast.success(data.message || 'Đã xóa sản phẩm thành công!');
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Handler Bật/Tắt trạng thái sản phẩm (ADMIN)
  const handleToggleProduct = async (productId: string, currentStatus: boolean) => {
    if (user?.role !== 'ADMIN') {
      toast.error('Chỉ Quản trị viên hệ thống (ADMIN) mới có quyền bật/tắt kinh doanh sản phẩm.');
      return;
    }

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_PRODUCT_STATUS',
          product_id: productId,
          is_active: !currentStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Lọc sản phẩm
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.skus.some((s) => s.id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || p.category_id === categoryFilter;
    const matchesBrand = brandFilter === 'ALL' || p.brand_id === brandFilter;

    return matchesSearch && matchesCategory && matchesBrand;
  });

  const isManager = user?.role === 'BRANCH_MANAGER';
  const managerBranch = user?.branch_id || 'BR_HN_01';

  return (
    <div className="space-y-6">
      {productTab === 'PRODUCTS' ? (
        <>
          {/* Thanh lọc & Tìm kiếm */}
          <div className="bg-white p-3.5 rounded-xl border border-black/10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên sản phẩm hoặc mã SKU..."
                className="w-full pl-9 pr-3 py-2 min-h-[42px] rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Lọc hãng */}
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 min-h-[42px] bg-white text-gray-700 focus:outline-none focus:border-black"
              >
                <option value="ALL">Tất cả thương hiệu</option>
                {dbBrands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>

              {/* Lọc danh mục */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 min-h-[42px] bg-white text-gray-700 focus:outline-none focus:border-black"
              >
                <option value="ALL">Tất cả danh mục (10 nhóm)</option>
                {dbCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <div className="text-xs text-gray-500 font-medium px-2 shrink-0">
                Tổng cộng: <strong>{filteredProducts.length}</strong> sản phẩm
              </div>

              {(user?.role === 'ADMIN' || user?.role === 'BRANCH_MANAGER') && (
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm sản phẩm</span>
                </button>
              )}
            </div>
          </div>

      {/* Bảng danh sách sản phẩm */}
      <div className="bg-white rounded-xl border border-black/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/75 text-gray-600 font-medium uppercase tracking-wider">
                <th className="py-3 px-4">Sản phẩm</th>
                <th className="py-3 px-4">Thương hiệu</th>
                <th className="py-3 px-4">Danh mục</th>
                <th className="py-3 px-4">Biến thể & Mã SKU</th>
                <th className="py-3 px-4 text-center">Tồn kho chi nhánh</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    <span>Đang tải dữ liệu sản phẩm...</span>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    Không tìm thấy sản phẩm nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveImageKitUrl(p.image_url) || resolveImageKitUrl('/images/products/yonex-astrox-99-pro.jpg')}
                          alt={p.name}
                          className="w-10 h-10 object-contain rounded-lg border border-gray-100 bg-white shrink-0 p-0.5"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = resolveImageKitUrl('/images/products/yonex-astrox-99-pro.jpg');
                          }}
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-gray-900 line-clamp-1">{p.name}</div>
                          <div className="text-[11px] text-gray-500 font-mono">{p.slug}</div>
                          {p.tags && p.tags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              {p.tags.map((tCode) => {
                                const tagDef = availableTags.find((at) => at.code === tCode);
                                return (
                                  <span
                                    key={tCode}
                                    style={{
                                      backgroundColor: tagDef?.bg_color || '#DC2626',
                                      color: tagDef?.text_color || '#FFFFFF',
                                    }}
                                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                                  >
                                    {tagDef?.name || tCode}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium capitalize">
                        {p.brand_name || p.brand_id}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-gray-600 font-normal">
                        {p.category_name || p.category_id}
                      </span>
                    </td>

                    {/* Danh sách SKUs & Giá */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {p.skus.map((s) => (
                          <div key={s.id} className="flex items-center justify-between gap-2 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                            <span className="font-mono text-[11px] font-medium text-gray-800">{s.id}</span>
                            <span className="text-[11px] font-semibold text-emerald-700">
                              {Number(s.price).toLocaleString('vi-VN')} đ
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Tồn kho chi nhánh */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className={`text-[13px] font-bold ${p.total_available > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {p.total_available}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          (Thực tế: {p.total_on_hand} · Đặt: {p.total_reserved})
                        </span>
                      </div>
                    </td>

                    {/* Trạng thái mở bán */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          p.is_active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        <span>{p.is_active ? 'Đang bán' : 'Tạm ngưng'}</span>
                      </span>
                    </td>

                    {/* Thao tác tinh gọn - Mở Unified Management Popup */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Nút xem storefront */}
                        <a
                          href={`/vot-cau-long/${p.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="min-w-[36px] min-h-[36px] touch-target-hit inline-flex items-center justify-center p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-black hover:border-black transition-colors"
                          title="Xem trang sản phẩm công khai"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* Nút gom tất cả thao tác vào 1 Popup duy nhất */}
                        {(user?.role === 'ADMIN' || user?.role === 'BRANCH_MANAGER') && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p, 'INFO')}
                            className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E3DD] bg-white hover:bg-stone-50 text-[#111613] hover:border-emerald-700 text-xs font-medium shadow-2xs transition-all cursor-pointer whitespace-nowrap touch-target-hit"
                            title="Mở bảng thao tác sản phẩm toàn diện (Thông tin, Kho, Ảnh, SKU)"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Quản lý</span>
                          </button>
                        )}

                        {/* Nút bật/tắt bán nhanh (Chỉ Admin) */}
                        {user?.role === 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => handleToggleProduct(p.id, p.is_active)}
                            className={`min-w-[36px] min-h-[36px] touch-target-hit inline-flex items-center justify-center p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              p.is_active
                                ? 'border-gray-200 text-gray-400 hover:text-amber-600 hover:border-amber-300'
                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={p.is_active ? 'Tạm ngưng kinh doanh' : 'Mở bán lại'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  ) : (
    /* TAB 2: QUẢN TRỊ THƯƠNG HIỆU & DANH MỤC (TAXONOMY) */
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Panel 1: Brands */}
      <div className="bg-white rounded-xl border border-black/10 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#0F5132]" />
            <h2 className="text-sm font-semibold text-gray-900">Danh mục Thương hiệu (Brands)</h2>
          </div>
          {user?.role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => {
                setEditingBrandItem(null);
                setBrandId('');
                setBrandName('');
                setBrandCountry('Nhật Bản');
                setBrandDesc('');
                setBrandModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F5132] hover:bg-[#0c4128] text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm thương hiệu</span>
            </button>
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {dbBrands.map((b) => (
            <div key={b.id} className="p-4 hover:bg-gray-50/60 transition-colors flex items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{b.name}</span>
                  <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{b.id}</span>
                  <span className="text-[11px] text-[#0F5132] font-medium">({b.country})</span>
                </div>
                {b.description && (
                  <p className="text-[11px] text-gray-500 mt-1 font-light leading-relaxed">{b.description}</p>
                )}
              </div>
              {user?.role === 'ADMIN' && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBrandItem(b);
                      setBrandId(b.id);
                      setBrandName(b.name);
                      setBrandCountry(b.country || '');
                      setBrandDesc(b.description || '');
                      setBrandModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 cursor-pointer"
                    title="Sửa thương hiệu"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBrand(b.id)}
                    className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 cursor-pointer"
                    title="Xóa thương hiệu"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Panel 2: Categories */}
      <div className="bg-white rounded-xl border border-black/10 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageOpen className="w-4 h-4 text-[#0F5132]" />
            <h2 className="text-sm font-semibold text-gray-900">Nhóm Danh mục Sản phẩm (Categories)</h2>
          </div>
          {user?.role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => {
                setEditingCatItem(null);
                setCatId('');
                setCatName('');
                setCatSlug('');
                setCatModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F5132] hover:bg-[#0c4128] text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm danh mục</span>
            </button>
          )}
        </div>
        <div className="divide-y divide-gray-100">
          {dbCategories.map((c) => (
            <div key={c.id} className="p-4 hover:bg-gray-50/60 transition-colors flex items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{c.name}</span>
                  <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{c.id}</span>
                </div>
                <div className="text-[11px] text-gray-500 font-mono mt-1">Đường dẫn: /{c.slug}</div>
              </div>
              {user?.role === 'ADMIN' && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCatItem(c);
                      setCatId(c.id);
                      setCatName(c.name);
                      setCatSlug(c.slug);
                      setCatModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 cursor-pointer"
                    title="Sửa danh mục"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(c.id)}
                    className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 cursor-pointer"
                    title="Xóa danh mục"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )}

  {/* Phân hệ Quản lý Tag & Huy hiệu sản phẩm */}
  {productTab === 'TAGS' && (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-black/10 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#0F5132]" />
              <h2 className="text-sm font-semibold text-gray-900">Danh mục Thẻ Tag &amp; Huy hiệu</h2>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Định nghĩa huy hiệu nổi bật (HOT, NEW, SALE, LIMITED...), tùy chọn màu nền, màu chữ và biểu tượng để gắn vào sản phẩm.
            </p>
          </div>
          {user?.role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => {
                setEditingTagItem(null);
                setTagCode('');
                setTagName('');
                setTagBgColor('#DC2626');
                setTagTextColor('#FFFFFF');
                setTagIcon('Tag');
                setTagSortOrder((availableTags.length + 1).toString());
                setTagModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F5132] hover:bg-[#0c4128] text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo Tag mới</span>
            </button>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {availableTags.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              Chưa có tag nào được kích hoạt. Hãy tạo tag đầu tiên!
            </div>
          ) : (
            availableTags.map((t) => (
              <div key={t.id} className="p-4 hover:bg-gray-50/60 transition-colors flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <span
                    style={{ backgroundColor: t.bg_color, color: t.text_color }}
                    className="px-3 py-1 rounded-full text-xs font-bold shadow-xs uppercase tracking-wider"
                  >
                    {t.name}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{t.name}</span>
                      <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">Mã: {t.code}</span>
                      <span className="text-[10px] text-gray-400">Thứ tự #{t.sort_order}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono mt-0.5 flex items-center gap-3">
                      <span>Màu nền: <span className="inline-block w-3 h-3 rounded-full border align-middle ml-1" style={{ backgroundColor: t.bg_color }} /> {t.bg_color}</span>
                      <span>Màu chữ: <span className="inline-block w-3 h-3 rounded-full border align-middle ml-1" style={{ backgroundColor: t.text_color }} /> {t.text_color}</span>
                    </div>
                  </div>
                </div>

                {user?.role === 'ADMIN' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleTag(t.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                        t.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}
                    >
                      {t.is_active ? 'Đang kích hoạt' : 'Tạm tắt'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTagItem(t);
                        setTagCode(t.code);
                        setTagName(t.name);
                        setTagBgColor(t.bg_color || '#DC2626');
                        setTagTextColor(t.text_color || '#FFFFFF');
                        setTagIcon(t.icon_name || 'Tag');
                        setTagSortOrder(t.sort_order?.toString() || '1');
                        setTagModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 cursor-pointer"
                      title="Sửa Tag"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTag(t.id, t.name)}
                      className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 cursor-pointer"
                      title="Xóa Tag"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )}


      {/* MODAL 2: Thêm mới sản phẩm toàn hệ thống (Chỉ ADMIN) */}
      {isCreateModalOpen && user?.role === 'ADMIN' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-black/10 shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#0F5132]" />
                <h3 className="font-semibold text-gray-900 text-sm">Thêm sản phẩm mới vào Catalog</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              <div className="space-y-1">
                <label className="font-medium text-gray-800 block">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Vợt Cầu Lông Yonex Nanoflare 1000Z"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-gray-800 block">Thương hiệu *</label>
                  <select
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white text-gray-800"
                  >
                    <option value="yonex">Yonex</option>
                    <option value="lining">Li-Ning</option>
                    <option value="victor">Victor</option>
                    <option value="mizuno">Mizuno</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-gray-800 block">Danh mục *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white text-gray-800"
                  >
                    <option value="cat_racket">Vợt cầu lông</option>
                    <option value="cat_string">Dây cước</option>
                    <option value="cat_grip">Quấn cán</option>
                    <option value="cat_shoes">Giày cầu lông</option>
                    <option value="cat_shuttle">Quả cầu lông</option>
                    <option value="cat_bag">Túi & Bao vợt</option>
                    <option value="cat_net">Lưới & Trụ</option>
                    <option value="cat_apparel">Quần áo</option>
                    <option value="cat_accessory">Phụ kiện thi đấu</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-gray-800 block">Giá niêm yết (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-gray-800 block">Mã SKU (tùy chọn)</label>
                  <input
                    type="text"
                    placeholder="Tự sinh nếu bỏ trống"
                    value={newSkuCode}
                    onChange={(e) => setNewSkuCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black uppercase font-mono"
                  />
                </div>
              </div>

              {/* Thông số kỹ thuật chuyên môn */}
              <div className="pt-2 border-t border-gray-100">
                <div className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0F5132]" />
                  <span>Thông số kỹ thuật chi tiết</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-gray-800 block">Lối chơi</label>
                    <input
                      type="text"
                      placeholder="Công thủ toàn diện / Tấn công / Phản tạt"
                      value={newPlayStyle}
                      onChange={(e) => setNewPlayStyle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-gray-800 block">Điểm cân bằng</label>
                    <input
                      type="text"
                      placeholder="Cân bằng / Nặng đầu / Nhẹ đầu"
                      value={newBalance}
                      onChange={(e) => setNewBalance(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-gray-800 block">Độ cứng đũa</label>
                    <input
                      type="text"
                      placeholder="Cứng / Trung bình / Dẻo"
                      value={newStiffness}
                      onChange={(e) => setNewStiffness(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-gray-800 block">Trọng lượng (Weight)</label>
                    <input
                      type="text"
                      placeholder="3U, 4U"
                      value={newWeightClasses}
                      onChange={(e) => setNewWeightClasses(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-gray-800 block">Cán cầm (Grip)</label>
                    <input
                      type="text"
                      placeholder="G5 / G6"
                      value={newGripSizes}
                      onChange={(e) => setNewGripSizes(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-gray-800 block">Mức căng tối đa (lbs)</label>
                    <input
                      type="number"
                      placeholder="30"
                      value={newMaxTension}
                      onChange={(e) => setNewMaxTension(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-gray-800 block">Chiều dài vợt (mm)</label>
                    <input
                      type="number"
                      placeholder="675"
                      value={newLengthMm}
                      onChange={(e) => setNewLengthMm(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium text-gray-800 block">Bảo hành (tháng)</label>
                    <input
                      type="number"
                      placeholder="12"
                      value={newWarrantyMonths}
                      onChange={(e) => setNewWarrantyMonths(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                    />
                  </div>
                </div>
              </div>

              <ImageUpload
                value={newImageUrl}
                onChange={setNewImageUrl}
                folder="products"
                label="Hình ảnh sản phẩm (Tải lên từ máy hoặc dán URL)"
                helperText="Hỗ trợ JPG, PNG, WEBP tối đa 10MB"
              />

              <div className="space-y-1">
                <label className="font-medium text-gray-800 block">Số lượng nhập ban đầu mỗi chi nhánh</label>
                <input
                  type="number"
                  min={0}
                  value={newInitialStock}
                  onChange={(e) => setNewInitialStock(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-gray-800 block">Mô tả sản phẩm</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả công nghệ đũa, chất liệu carbon..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black resize-none"
                />
              </div>

              {/* Gắn Thẻ Tag & Huy hiệu */}
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <label className="font-semibold text-gray-900 block text-xs flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#0F5132]" />
                  <span>Gắn Thẻ Tag &amp; Huy hiệu nổi bật</span>
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {availableTags.map((at) => {
                    const isSelected = newTags.includes(at.code);
                    return (
                      <button
                        key={at.id}
                        type="button"
                        onClick={() => {
                          setNewTags((prev) =>
                            isSelected ? prev.filter((c) => c !== at.code) : [...prev, at.code]
                          );
                        }}
                        style={{
                          backgroundColor: isSelected ? at.bg_color : '#F3F4F6',
                          color: isSelected ? at.text_color : '#374151',
                          borderColor: at.bg_color,
                        }}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                          isSelected ? 'shadow-xs scale-105 ring-2 ring-black/10' : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {at.name} ({at.code})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-lg bg-[#0F5132] text-white font-medium hover:bg-[#0c4128] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? 'Đang tạo...' : 'Tạo sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UNIFIED MODAL: BẢNG POPUP QUẢN LÝ TOÀN DIỆN SẢN PHẨM (MENU TABS) */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-black/10 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-[#FAFAFA]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-sm truncate max-w-md">{editingProduct.name}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-gray-100 text-gray-600 border border-gray-200">
                      {editingProduct.category_id}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 font-mono">
                    ID: {editingProduct.id.slice(0, 8)}... | {editingProduct.skus?.length || 0} Biến thể SKU
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                title="Đóng popup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Menu */}
            <div className="flex items-center gap-1.5 px-5 py-2.5 bg-white border-b border-gray-100 overflow-x-auto">
              {user?.role === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => setActiveActionTab('INFO')}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    activeActionTab === 'INFO'
                      ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>1. Thông tin chung</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveActionTab('STOCK')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeActionTab === 'STOCK'
                    ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Boxes className="w-3.5 h-3.5" />
                <span>2. Tồn kho chi nhánh</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveActionTab('GALLERY')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeActionTab === 'GALLERY'
                    ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>3. Ảnh 7 góc ({editingProduct.gallery?.length || 0}/7)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveActionTab('SKU')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeActionTab === 'SKU'
                    ? 'bg-emerald-700 text-white shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>4. Biến thể SKU ({editingProduct.skus?.length || 0})</span>
              </button>
            </div>

            {/* Modal Body Container with scroll */}
            <div className="p-5 overflow-y-auto flex-1 text-xs">
              {/* TAB 1: THÔNG TIN CHUNG SẢN PHẨM (Chỉ dành cho ADMIN) */}
              {activeActionTab === 'INFO' && user?.role === 'ADMIN' && (
                <form onSubmit={handleUpdateProduct} className="space-y-4">
                    <div className="space-y-1">
                      <label className="font-medium text-gray-800 block">Tên sản phẩm *</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-medium text-gray-800 block">Thương hiệu *</label>
                        <select
                          value={editBrand}
                          onChange={(e) => setEditBrand(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white text-gray-800"
                        >
                          <option value="yonex">Yonex</option>
                          <option value="lining">Li-Ning</option>
                          <option value="victor">Victor</option>
                          <option value="mizuno">Mizuno</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-medium text-gray-800 block">Danh mục *</label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white text-gray-800"
                        >
                          <option value="cat_racket">Vợt cầu lông</option>
                          <option value="cat_string">Dây cước</option>
                          <option value="cat_grip">Quấn cán</option>
                          <option value="cat_shoes">Giày cầu lông</option>
                          <option value="cat_shuttle">Quả cầu lông</option>
                          <option value="cat_bag">Túi & Bao vợt</option>
                          <option value="cat_net">Lưới & Trụ</option>
                          <option value="cat_apparel">Quần áo</option>
                          <option value="cat_accessory">Phụ kiện thi đấu</option>
                        </select>
                      </div>
                    </div>

                    {/* Thông số kỹ thuật chuyên môn */}
                    <div className="pt-3 border-t border-gray-100">
                      <div className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Thông số kỹ thuật chi tiết</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="font-medium text-gray-800 block">Lối chơi</label>
                          <input
                            type="text"
                            placeholder="Công thủ toàn diện / Tấn công"
                            value={editPlayStyle}
                            onChange={(e) => setEditPlayStyle(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-medium text-gray-800 block">Điểm cân bằng</label>
                          <input
                            type="text"
                            placeholder="Cân bằng / Nặng đầu / Nhẹ đầu"
                            value={editBalance}
                            onChange={(e) => setEditBalance(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-medium text-gray-800 block">Độ cứng đũa</label>
                          <input
                            type="text"
                            placeholder="Cứng / Trung bình / Dẻo"
                            value={editStiffness}
                            onChange={(e) => setEditStiffness(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-medium text-gray-800 block">Trọng lượng (Weight)</label>
                          <input
                            type="text"
                            placeholder="3U, 4U"
                            value={editWeightClasses}
                            onChange={(e) => setEditWeightClasses(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-medium text-gray-800 block">Cán cầm (Grip)</label>
                          <input
                            type="text"
                            placeholder="G5 / G6"
                            value={editGripSizes}
                            onChange={(e) => setEditGripSizes(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-medium text-gray-800 block">Mức căng tối đa (lbs)</label>
                          <input
                            type="number"
                            placeholder="30"
                            value={editMaxTension}
                            onChange={(e) => setEditMaxTension(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-medium text-gray-800 block">Chiều dài vợt (mm)</label>
                          <input
                            type="number"
                            placeholder="675"
                            value={editLengthMm}
                            onChange={(e) => setEditLengthMm(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-medium text-gray-800 block">Bảo hành (tháng)</label>
                          <input
                            type="number"
                            placeholder="12"
                            value={editWarrantyMonths}
                            onChange={(e) => setEditWarrantyMonths(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                          />
                        </div>
                      </div>
                    </div>

                    <ImageUpload
                      value={editImageUrl}
                      onChange={setEditImageUrl}
                      folder="products"
                      label="Hình ảnh đại diện sản phẩm (Tải lên hoặc dán URL)"
                      helperText="Hỗ trợ JPG, PNG, WEBP tối đa 10MB"
                    />

                    <div className="space-y-1">
                      <label className="font-medium text-gray-800 block">Mô tả sản phẩm</label>
                      <textarea
                        rows={3}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black resize-none"
                      />
                    </div>

                    {/* Gắn Thẻ Tag & Huy hiệu */}
                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                      <label className="font-semibold text-gray-900 block text-xs flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Gắn Thẻ Tag &amp; Huy hiệu nổi bật</span>
                      </label>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {availableTags.map((at) => {
                          const isSelected = editTags.includes(at.code);
                          return (
                            <button
                              key={at.id}
                              type="button"
                              onClick={() => {
                                setEditTags((prev) =>
                                  isSelected ? prev.filter((c) => c !== at.code) : [...prev, at.code]
                                );
                              }}
                              style={{
                                backgroundColor: isSelected ? at.bg_color : '#F3F4F6',
                                color: isSelected ? at.text_color : '#374151',
                                borderColor: at.bg_color,
                              }}
                              className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                                isSelected ? 'shadow-xs scale-105 ring-2 ring-black/10' : 'opacity-70 hover:opacity-100'
                              }`}
                            >
                              {isSelected ? '✓ ' : '+ '}
                              {at.name} ({at.code})
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setEditingProduct(null)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                      >
                        Đóng
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdatingProduct}
                        className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-medium hover:bg-emerald-800 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isUpdatingProduct ? 'Đang lưu...' : 'Lưu thông tin sản phẩm'}
                      </button>
                    </div>
                  </form>
              )}

              {/* TAB 2: TỒN KHO CHI NHÁNH */}
              {activeActionTab === 'STOCK' && (
                <div className="space-y-4">
                  {editingStockSku ? (
                    <form onSubmit={handleSaveStock} className="space-y-4">
                      {/* Chọn biến thể SKU cần sửa kho nếu sản phẩm có nhiều SKU */}
                      {editingProduct.skus.length > 1 && (
                        <div className="space-y-1">
                          <label className="font-medium text-gray-800 block">Chọn biến thể SKU để sửa kho:</label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {editingProduct.skus.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  setEditingStockSku({ productName: editingProduct.name, sku: s });
                                  setNewStockQty(s.stock.on_hand);
                                }}
                                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                                  editingStockSku.sku.id === s.id
                                    ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                              >
                                <div className="font-mono font-bold text-gray-900 text-xs">{s.id}</div>
                                <div className="text-[11px] text-gray-500 mt-0.5">
                                  Tồn: <span className="font-bold text-emerald-700">{s.stock.on_hand}</span> | Giữ: {s.stock.reserved}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                        <div>
                          <span className="text-gray-500 font-normal">Chi nhánh áp dụng:</span>
                          <div className="font-semibold text-gray-800 text-sm mt-0.5">
                            {BRANCH_NAMES[isManager ? managerBranch : selectedBranch === 'ALL' ? 'BR_HN_01' : selectedBranch]}
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono mt-0.5">SKU mục tiêu: {editingStockSku.sku.id}</div>
                        </div>
                        <Building2 className="w-6 h-6 text-emerald-700" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                          <span className="text-gray-500">Tồn kho hiện tại:</span>
                          <div className="text-lg font-bold text-gray-800 mt-1">{editingStockSku.sku.stock.on_hand}</div>
                        </div>
                        <div className="p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                          <span className="text-gray-500">Đang giữ chỗ (Reserved):</span>
                          <div className="text-lg font-bold text-amber-600 mt-1">{editingStockSku.sku.stock.reserved}</div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-medium text-gray-800 block">Số lượng tồn kho thực tế mới (on_hand) *</label>
                        <input
                          type="number"
                          min={editingStockSku.sku.stock.reserved}
                          required
                          value={newStockQty}
                          onChange={(e) => setNewStockQty(parseInt(e.target.value, 10) || 0)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-900 focus:outline-none focus:border-black"
                        />
                        <span className="text-[11px] text-gray-500">
                          Số lượng tồn không thể nhỏ hơn số lượng đang giữ chỗ ({editingStockSku.sku.stock.reserved}).
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="font-medium text-gray-800 block">Lý do điều chỉnh (Ghi vào sổ cái R10) *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ví dụ: Kiểm kê định kỳ chi nhánh / Hàng về thêm từ kho tổng"
                          value={stockReason}
                          onChange={(e) => setStockReason(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(null)}
                          className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                        >
                          Đóng
                        </button>
                        <button
                          type="submit"
                          disabled={isUpdatingStock}
                          className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-medium hover:bg-emerald-800 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isUpdatingStock ? 'Đang lưu...' : 'Xác nhận cập nhật tồn kho'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="py-8 text-center text-gray-500">
                      <p className="font-semibold text-sm text-gray-700">Sản phẩm này chưa có biến thể SKU nào.</p>
                      <p className="text-xs text-gray-400 mt-1">Vui lòng qua tab "4. Biến thể SKU" để tạo SKU trước.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: THƯ VIỆN ẢNH 7 GÓC CHUYÊN SÂU */}
              {activeActionTab === 'GALLERY' && (
                <div className="space-y-5">
                  <div>
                    <div className="font-semibold text-gray-800 mb-2 flex items-center justify-between">
                      <span>Ảnh catalog hiện có ({editingProduct.gallery?.length || 0}/7 góc chuẩn kỹ thuật):</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { angle: 'FRONT', label: 'Toàn thân trước' },
                        { angle: 'BACK', label: 'Mặt sau' },
                        { angle: 'SIDE', label: 'Cạnh khung' },
                        { angle: 'HEAD', label: 'Đầu vợt & Gen' },
                        { angle: 'THROAT', label: 'Khớp chữ T' },
                        { angle: 'GRIP', label: 'Cán & Chụp cán' },
                        { angle: 'DETAIL', label: 'Tem & Chi tiết' },
                      ].map(({ angle, label }) => {
                        const img = editingProduct.gallery?.find((g) => g.angle === angle);
                        return (
                          <div
                            key={angle}
                            className={`rounded-xl border p-2.5 flex flex-col justify-between transition-colors ${
                              img ? 'bg-white border-black/15 shadow-xs' : 'bg-gray-50/80 border-dashed border-gray-200'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <span className="font-bold text-[10px] uppercase text-gray-700">{angle}</span>
                                {img?.is_primary && (
                                  <span className="px-1 py-0.2 rounded text-[9px] font-semibold bg-emerald-700 text-white">
                                    Chính
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-500 mb-2">{label}</div>

                              <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-100">
                                {img ? (
                                  <img
                                    src={resolveImageKitUrl(img.image_url)}
                                    alt={angle}
                                    className="w-full h-full object-contain p-1"
                                  />
                                ) : (
                                  <span className="text-[10px] text-gray-400 italic">Chưa có ảnh</span>
                                )}
                              </div>
                            </div>

                            {img && (
                              <div className="flex items-center justify-between gap-1 mt-2 pt-2 border-t border-gray-100">
                                {!img.is_primary && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedAngle(angle as any);
                                      setGalleryImageUrl(img.image_url);
                                      setIsPrimaryImage(true);
                                    }}
                                    className="text-[10px] text-blue-600 hover:underline"
                                  >
                                    Đặt làm chính
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteImage(img.id)}
                                  className="text-[10px] text-red-600 hover:text-red-800 ml-auto"
                                >
                                  Xóa
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Form thêm hoặc cập nhật ảnh góc */}
                  <form onSubmit={handleSaveImage} className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                    <div className="font-semibold text-gray-900 text-xs flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Tải lên hoặc cập nhật ảnh góc chụp</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-medium text-gray-800 block">Chọn góc chụp *</label>
                        <select
                          value={selectedAngle}
                          onChange={(e) => setSelectedAngle(e.target.value as any)}
                          className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white text-gray-800"
                        >
                          <option value="FRONT">FRONT — Toàn thân trước</option>
                          <option value="BACK">BACK — Toàn thân sau</option>
                          <option value="SIDE">SIDE — Cạnh khung vợt</option>
                          <option value="HEAD">HEAD — Đầu vợt / Hệ thống gen</option>
                          <option value="THROAT">THROAT — Khớp chữ T (T-Joint)</option>
                          <option value="GRIP">GRIP — Cán cầm & Nắp chụp cán</option>
                          <option value="DETAIL">DETAIL — Tem kiểm định / Công nghệ</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-3 sm:pt-5">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-800 select-none">
                          <input
                            type="checkbox"
                            checked={isPrimaryImage}
                            onChange={(e) => setIsPrimaryImage(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-700 accent-emerald-700"
                          />
                          <span>Đặt làm ảnh đại diện chính của sản phẩm</span>
                        </label>
                      </div>
                    </div>

                    <ImageUpload
                      value={galleryImageUrl}
                      onChange={setGalleryImageUrl}
                      folder="products"
                      label="Hình ảnh góc chụp"
                      helperText="Tải lên tệp ảnh (JPG, PNG, WEBP) hoặc nhập URL"
                    />

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={savingImage || !galleryImageUrl}
                        className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-medium hover:bg-emerald-800 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {savingImage ? 'Đang lưu ảnh...' : 'Lưu ảnh vào góc này'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 4: BIẾN THỂ SKU */}
              {activeActionTab === 'SKU' && (
                <div className="space-y-5">
                  {/* Danh sách các SKU hiện có */}
                  <div>
                    <div className="font-semibold text-gray-800 mb-2">Các SKU hiện có của sản phẩm ({editingProduct.skus?.length || 0}):</div>
                    <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
                      {editingProduct.skus?.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 italic">Chưa có SKU nào</div>
                      ) : (
                        editingProduct.skus.map((s) => (
                          <div key={s.id} className="p-3 flex items-center justify-between gap-3 hover:bg-gray-50/60">
                            <div>
                              <div className="font-mono font-bold text-gray-900 text-xs">{s.id}</div>
                              <div className="text-[11px] text-gray-500 mt-0.5">
                                Trọng lượng: <span className="font-medium text-gray-700">{s.weight || 'N/A'}</span> | 
                                Cán: <span className="font-medium text-gray-700">{s.grip_size || 'N/A'}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-emerald-700 text-xs">
                                {Number(s.price).toLocaleString('vi-VN')} đ
                              </div>
                              <div className="text-[11px] text-gray-500 mt-0.5">
                                Tồn: <span className="font-semibold text-gray-800">{s.stock.on_hand}</span> | 
                                Giữ chỗ: <span className="font-semibold text-amber-600">{s.stock.reserved}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Form thêm SKU mới */}
                  {user?.role === 'ADMIN' && (
                    <form onSubmit={handleAddSku} className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3.5">
                      <div className="font-semibold text-gray-900 text-xs flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Thêm biến thể SKU mới</span>
                      </div>

                      <div className="space-y-1">
                        <label className="font-medium text-gray-800 block">Mã SKU duy nhất *</label>
                        <input
                          type="text"
                          required
                          value={addSkuCode}
                          onChange={(e) => setAddSkuCode(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 font-mono font-semibold focus:outline-none focus:border-black uppercase bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-medium text-gray-800 block">Giá bán (VNĐ) *</label>
                          <input
                            type="number"
                            required
                            value={addSkuPrice}
                            onChange={(e) => setAddSkuPrice(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black font-semibold bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="font-medium text-gray-800 block">Màu sắc</label>
                          <input
                            type="text"
                            value={addSkuColor}
                            onChange={(e) => setAddSkuColor(e.target.value)}
                            placeholder="VD: Đen Đỏ"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="font-medium text-gray-800 block">Trọng lượng (Weight)</label>
                          <select
                            value={addSkuWeight}
                            onChange={(e) => setAddSkuWeight(e.target.value)}
                            className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white text-gray-800"
                          >
                            <option value="3U">3U (85-89g)</option>
                            <option value="4U">4U (80-84g)</option>
                            <option value="5U">5U (75-79g)</option>
                            <option value="F">F (68-73g)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="font-medium text-gray-800 block">Chu vi cán (Grip Size)</label>
                          <select
                            value={addSkuGrip}
                            onChange={(e) => setAddSkuGrip(e.target.value)}
                            className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white text-gray-800"
                          >
                            <option value="G5">G5 (Tiêu chuẩn)</option>
                            <option value="G6">G6 (Cán nhỏ)</option>
                            <option value="G4">G4 (Cán to)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="font-medium text-gray-800 block">Số lượng tồn kho ban đầu mỗi chi nhánh</label>
                        <input
                          type="number"
                          min={0}
                          value={addSkuStock}
                          onChange={(e) => setAddSkuStock(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black bg-white"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="submit"
                          disabled={submittingSku}
                          className="px-4 py-2 rounded-lg bg-emerald-700 text-white font-medium hover:bg-emerald-800 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {submittingSku ? 'Đang thêm...' : 'Xác nhận tạo SKU'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: THÊM / SỬA THƯƠNG HIỆU */}
      {brandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-black/10 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0F5132]" />
                <h3 className="font-semibold text-gray-900 text-sm">
                  {editingBrandItem ? 'Chỉnh sửa Thương hiệu' : 'Thêm Thương hiệu Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBrandModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBrand} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Mã thương hiệu (ID) *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingBrandItem}
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value.toLowerCase())}
                  placeholder="VD: mizuno, victor, kumpoo..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 font-mono disabled:bg-gray-100 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Tên thương hiệu *</label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="VD: Mizuno, Victor..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black font-medium"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Quốc gia xuất xứ</label>
                <input
                  type="text"
                  value={brandCountry}
                  onChange={(e) => setBrandCountry(e.target.value)}
                  placeholder="VD: Nhật Bản, Đài Loan, Trung Quốc..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Mô tả / Giới thiệu</label>
                <textarea
                  rows={2}
                  value={brandDesc}
                  onChange={(e) => setBrandDesc(e.target.value)}
                  placeholder="Mô tả thương hiệu, thế mạnh dòng sản phẩm..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setBrandModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingBrand}
                  className="px-4 py-2 rounded-lg bg-[#0F5132] text-white font-medium hover:bg-[#0c4128] transition-colors cursor-pointer"
                >
                  {savingBrand ? 'Đang lưu...' : 'Lưu thương hiệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: THÊM / SỬA DANH MỤC */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-black/10 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <PackageOpen className="w-4 h-4 text-[#0F5132]" />
                <h3 className="font-semibold text-gray-900 text-sm">
                  {editingCatItem ? 'Chỉnh sửa Danh mục' : 'Thêm Danh mục Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCatModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Mã danh mục (ID) *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingCatItem}
                  value={catId}
                  onChange={(e) => setCatId(e.target.value.toLowerCase())}
                  placeholder="VD: cat_racket, cat_shoes, cat_grip..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 font-mono disabled:bg-gray-100 focus:outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Tên danh mục hiển thị *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="VD: Vợt cầu lông chính hãng..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black font-medium"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Đường dẫn URL (Slug) *</label>
                <input
                  type="text"
                  required
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value.toLowerCase())}
                  placeholder="VD: vot-cau-long, giay-cau-long..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 font-mono focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingCat}
                  className="px-4 py-2 rounded-lg bg-[#0F5132] text-white font-medium hover:bg-[#0c4128] transition-colors cursor-pointer"
                >
                  {savingCat ? 'Đang lưu...' : 'Lưu danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: TẠO / SỬA THẺ TAG & HUY HIỆU */}
      {tagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-black/10 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#0F5132]" />
                <h3 className="font-semibold text-gray-900 text-sm">
                  {editingTagItem ? 'Chỉnh sửa Thẻ Tag' : 'Tạo Thẻ Tag &amp; Huy hiệu mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTagModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTag} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Mã Tag (Code) *</label>
                  <input
                    type="text"
                    required
                    value={tagCode}
                    onChange={(e) => setTagCode(e.target.value.toUpperCase())}
                    placeholder="VD: HOT, NEW, SALE"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 font-mono font-bold focus:outline-none focus:border-black uppercase"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Tên hiển thị *</label>
                  <input
                    type="text"
                    required
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    placeholder="VD: Bán chạy / Hot"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Màu nền (Background)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={tagBgColor}
                      onChange={(e) => setTagBgColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={tagBgColor}
                      onChange={(e) => setTagBgColor(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Màu chữ (Text Color)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={tagTextColor}
                      onChange={(e) => setTagTextColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={tagTextColor}
                      onChange={(e) => setTagTextColor(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Xem trước huy hiệu</label>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center">
                  <span
                    style={{ backgroundColor: tagBgColor, color: tagTextColor }}
                    className="px-4 py-1.5 rounded-full text-xs font-bold shadow-xs uppercase tracking-wider"
                  >
                    {tagName || 'TÊN HUY HIỆU'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setTagModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingTag}
                  className="px-4 py-2 rounded-lg bg-[#0F5132] text-white font-medium hover:bg-[#0c4128] transition-colors cursor-pointer"
                >
                  {savingTag ? 'Đang lưu...' : 'Lưu Thẻ Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-stone-500">Đang tải sản phẩm...</div>}>
      <AdminProductsPageContent />
    </React.Suspense>
  );
}
