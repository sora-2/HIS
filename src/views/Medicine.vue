<template>
  <div class="medicine-container">
    <h2>药品管理</h2>

    <!-- 搜索和操作区域 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input v-model="searchName" placeholder="按药品名称搜索" clearable></el-input>
        </el-col>
        <el-col :span="6">
          <el-input v-model="searchManufacturer" placeholder="按生产厂家搜索" clearable></el-input>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="searchMedicines">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-col>
        <el-col :span="6" style="text-align: right;">
          <el-button type="primary" @click="openAddDialog">添加药品</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 药品表格 -->
    <el-table :data="medicineList" style="width: 100%; margin-top: 20px;" border stripe>
      <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
      <el-table-column prop="name" label="药品名称"></el-table-column>
      <el-table-column prop="category" label="分类"></el-table-column>
      <el-table-column prop="specification" label="规格"></el-table-column>
      <el-table-column prop="price" label="价格">
        <template #default="scope">
          <span style="color: #67C23A;">￥{{ scope.row.price || '0.00' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="stock" label="库存">
        <template #default="scope">
          <el-tag :type="scope.row.stockQuantity < scope.row.minStock ? 'danger' : 'success'">
            {{ scope.row.stockQuantity || scope.row.stock || 0 }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="manufacturer" label="生产厂家" show-overflow-tooltip></el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'ACTIVE' ? 'success' : 'danger'">
            {{ scope.row.status === 'ACTIVE' ? '可用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" align="center">
        <template #default="scope">
          <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="pagination.pageNum"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pagination.pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="pagination.total"
      style="margin-top: 20px; text-align: right;"
    ></el-pagination>

    <!-- 添加/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="currentMedicine" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
        <el-form-item label="药品名称">
          <el-input v-model="currentMedicine.name"></el-input>
        </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="药品分类">
              <el-input v-model="currentMedicine.category"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="规格">
              <el-input v-model="currentMedicine.specification"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位">
              <el-input v-model="currentMedicine.unit"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="价格">
              <el-input-number v-model="currentMedicine.price" :precision="2" :step="0.1" :min="0" style="width: 100%;"></el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="库存数量">
              <el-input-number v-model="currentMedicine.stockQuantity" :min="0" style="width: 100%;"></el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最低库存">
              <el-input-number v-model="currentMedicine.minStock" :min="0" style="width: 100%;"></el-input-number>
        </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="currentMedicine.status" style="width: 100%;">
                <el-option label="可用" value="ACTIVE"></el-option>
                <el-option label="停用" value="INACTIVE"></el-option>
              </el-select>
        </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="生产厂家">
          <el-input v-model="currentMedicine.manufacturer"></el-input>
        </el-form-item>
        
        <el-form-item label="储存条件">
          <el-input v-model="currentMedicine.storageConditions"></el-input>
        </el-form-item>
        
        <el-form-item label="用法用量">
          <el-input v-model="currentMedicine.usageInstructions" type="textarea" :rows="2"></el-input>
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="有效期">
              <el-date-picker
                v-model="currentMedicine.expiryDate"
                type="date"
                placeholder="选择有效期"
                value-format="YYYY-MM-DD"
                style="width: 100%;"
              ></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveMedicine">保存</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';

const medicineList = ref([]);
const pagination = ref({
  pageNum: 1,
  pageSize: 10,
  total: 0
});
const dialogVisible = ref(false);
const dialogTitle = ref('');
const currentMedicine = ref({
  id: null,
  name: '',
  category: '',
  specification: '',
  unit: '',
  price: 0,
  stockQuantity: 0,
  minStock: 10,
  manufacturer: '',
  storageConditions: '',
  usageInstructions: '',
  expiryDate: null,
  status: 'ACTIVE'
});

// 搜索相关
const searchName = ref('');
const searchManufacturer = ref('');

// 获取药品列表
const fetchMedicineList = async () => {
  try {
    const response = await axios.get('/api/medicine', {
      params: {
        pageNum: pagination.value.pageNum,
        pageSize: pagination.value.pageSize,
        name: searchName.value, // 添加药品名称搜索参数
        manufacturer: searchManufacturer.value // 添加生产厂家搜索参数
      }
    });
    if (response.data.code === 200) {
      medicineList.value = response.data.data.records;
      pagination.value.total = response.data.data.total;
    } else {
      ElMessage.error('获取药品列表失败: ' + response.data.message);
    }
  } catch (error) {
    ElMessage.error('获取药品列表失败: ' + error.message);
  }
};

// 搜索药品
const searchMedicines = () => {
  pagination.value.pageNum = 1; // 搜索时重置到第一页
  fetchMedicineList();
};

// 重置搜索
const resetSearch = () => {
  searchName.value = '';
  searchManufacturer.value = '';
  searchMedicines(); // 调用搜索方法刷新列表
};

// 处理分页大小变化
const handleSizeChange = (newSize) => {
  pagination.value.pageSize = newSize;
  fetchMedicineList();
};

// 处理当前页变化
const handleCurrentChange = (newPage) => {
  pagination.value.pageNum = newPage;
  fetchMedicineList();
};

// 打开添加弹窗
const openAddDialog = () => {
  dialogTitle.value = '添加药品';
  currentMedicine.value = {
    id: null,
    name: '',
    category: '',
    specification: '',
    unit: '',
    price: 0,
    stockQuantity: 0,
    minStock: 10,
    manufacturer: '',
    storageConditions: '',
    usageInstructions: '',
    expiryDate: null,
    status: 'ACTIVE'
  };
  dialogVisible.value = true;
};

// 处理编辑
const handleEdit = (row) => {
  dialogTitle.value = '编辑药品';
  currentMedicine.value = { ...row };
  dialogVisible.value = true;
};

// 保存药品
const saveMedicine = async () => {
  try {
     // 构建提交数据，新 medicine 不发送 ID
    const submitData = currentMedicine.value.id
      ? { ...currentMedicine.value }
      : {
          name: currentMedicine.value.name,
          category: currentMedicine.value.category,
          specification: currentMedicine.value.specification,
          unit: currentMedicine.value.unit,
          price: currentMedicine.value.price,
          stockQuantity: currentMedicine.value.stockQuantity,
          minStock: currentMedicine.value.minStock,
          manufacturer: currentMedicine.value.manufacturer,
          storageConditions: currentMedicine.value.storageConditions,
          usageInstructions: currentMedicine.value.usageInstructions,
          expiryDate: currentMedicine.value.expiryDate,
          status: currentMedicine.value.status
        };

    const response = await axios.post('/api/medicine', submitData);

    if (response.data.code === 200) {
      ElMessage.success(dialogTitle.value === '添加药品' ? '添加成功' : '更新成功');
      dialogVisible.value = false;
      fetchMedicineList(); // 刷新列表
    } else {
      ElMessage.error(response.data.message);
    }
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message);
  }
};

// 处理删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定删除药品 ${row.name} (ID: ${row.id}) 的记录吗?`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const response = await axios.delete(`/api/medicine/${row.id}`);
      if (response.data.code === 200) {
        ElMessage.success('删除成功');
        fetchMedicineList(); // 刷新列表
      } else {
        ElMessage.error(response.data.message);
      }
    } catch (error) {
      ElMessage.error('删除失败: ' + error.message);
    }
  }).catch(() => {
    ElMessage.info('已取消删除');
  });
};

// 页面加载时获取数据
onMounted(() => {
  fetchMedicineList();
});
</script>

<style scoped>
.medicine-container {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.el-table {
  /* 可以在这里添加表格的额外样式 */
}

.el-form-item {
  margin-bottom: 18px;
}

.dialog-footer button:first-child {
  margin-right: 10px;
}
</style> 