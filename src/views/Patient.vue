<template>
  <div class="patient-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-info">
        <h1>患者管理</h1>
        <p>管理医院所有患者信息，包括档案创建、信息维护、就诊记录等</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" icon="Plus" @click="showAddDialog">
          新增患者
        </el-button>
        <el-button icon="Download" @click="exportPatients">
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" :inline="true" class="search-form">
        <el-form-item label="姓名">
          <el-input 
            v-model="searchForm.name" 
            placeholder="请输入患者姓名"
            clearable
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="身份证号">
          <el-input 
            v-model="searchForm.idCard" 
            placeholder="请输入身份证号"
            clearable
            @clear="handleSearch"
          />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="searchForm.gender" placeholder="请选择性别" clearable>
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
          </el-select>
        </el-form-item>
        <el-form-item label="年龄范围">
          <el-input 
            v-model="searchForm.minAge" 
            placeholder="最小年龄"
            type="number"
            style="width: 100px"
          />
          <span style="margin: 0 10px">-</span>
          <el-input 
            v-model="searchForm.maxAge" 
            placeholder="最大年龄"
            type="number"
            style="width: 100px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="Search" @click="handleSearch">
            搜索
          </el-button>
          <el-button icon="Refresh" @click="resetSearch">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 患者列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>患者列表</span>
          <el-text type="info">共 {{ total }} 条记录</el-text>
        </div>
      </template>
      
      <el-table 
        :data="patientList" 
        stripe 
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.gender === '男' ? 'primary' : 'danger'" size="small">
              {{ scope.row.gender }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="80" />
        <el-table-column prop="phone" label="电话" width="130" />
        <el-table-column prop="idCard" label="身份证号" width="180" />
        <el-table-column prop="bloodType" label="血型" width="80" />
        <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button size="small" type="primary" @click="viewPatient(scope.row)">
              查看
            </el-button>
            <el-button size="small" type="warning" @click="editPatient(scope.row)">
              编辑
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="deletePatient(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          :current-page="pagination.page"
          :page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      :title="dialogTitle"
      v-model="dialogVisible"
      width="600px"
      @close="resetForm"
    >
      <el-form
        :model="patientForm"
        :rules="formRules"
        ref="patientFormRef"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="patientForm.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="patientForm.gender">
                            <el-radio value="男">男</el-radio>
            <el-radio value="女">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="年龄" prop="age">
              <el-input-number 
                v-model="patientForm.age" 
                :min="0" 
                :max="150" 
                placeholder="请输入年龄"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="血型" prop="bloodType">
              <el-select v-model="patientForm.bloodType" placeholder="请选择血型" style="width: 100%">
                <el-option label="A型" value="A" />
                <el-option label="B型" value="B" />
                <el-option label="AB型" value="AB" />
                <el-option label="O型" value="O" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="身份证号" prop="idCard">
          <el-input v-model="patientForm.idCard" placeholder="请输入身份证号" />
        </el-form-item>

        <el-form-item label="电话" prop="phone">
          <el-input v-model="patientForm.phone" placeholder="请输入联系电话" />
        </el-form-item>

        <el-form-item label="地址" prop="address">
          <el-input 
            v-model="patientForm.address" 
            type="textarea" 
            :rows="3"
            placeholder="请输入详细地址"
          />
        </el-form-item>

        <el-form-item label="过敏史" prop="allergies">
          <el-input 
            v-model="patientForm.allergies" 
            type="textarea" 
            :rows="2"
            placeholder="请输入过敏史信息（可选）"
          />
        </el-form-item>

        <el-form-item label="备注" prop="remarks">
          <el-input 
            v-model="patientForm.remarks" 
            type="textarea" 
            :rows="2"
            placeholder="其他备注信息（可选）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 患者详情对话框 -->
    <el-dialog
      title="患者详情"
      v-model="detailDialogVisible"
      width="700px"
    >
      <div class="patient-detail" v-if="currentPatient">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="姓名">{{ currentPatient.name }}</el-descriptions-item>
          <el-descriptions-item label="性别">
            <el-tag :type="currentPatient.gender === '男' ? 'primary' : 'danger'" size="small">
              {{ currentPatient.gender }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="年龄">{{ currentPatient.age }}岁</el-descriptions-item>
          <el-descriptions-item label="血型">{{ currentPatient.bloodType }}型</el-descriptions-item>
          <el-descriptions-item label="身份证号">{{ currentPatient.idCard }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ currentPatient.phone }}</el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">{{ currentPatient.address }}</el-descriptions-item>
          <el-descriptions-item label="过敏史" :span="2">
            {{ currentPatient.allergies || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">
            {{ currentPatient.remarks || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ currentPatient.createTime }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Search, Refresh } from '@element-plus/icons-vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()

// 响应式数据
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const isEdit = ref(false)
const currentPatient = ref(null)
const selectedPatients = ref([])

// 表单引用
const patientFormRef = ref(null)

// 搜索表单
const searchForm = reactive({
  name: '',
  idCard: '',
  gender: '',
  minAge: '',
  maxAge: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  size: 10
})

const total = ref(0)

// 患者表单
const patientForm = reactive({
  id: null,
  name: '',
  gender: '男',
  age: '',
  bloodType: '',
  idCard: '',
  phone: '',
  address: '',
  allergies: '',
  remarks: ''
})

// 表单验证规则
const formRules = {
  name: [{ required: true, message: '请输入患者姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  age: [{ required: true, message: '请输入年龄', trigger: 'blur' }],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, message: '身份证号格式不正确', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }]
}

// 患者列表数据
const patientList = ref([])

// 计算属性
const dialogTitle = computed(() => {
  return isEdit.value ? '编辑患者' : '新增患者'
})

// 方法
const handleSearch = () => {
  pagination.page = 1
  loadPatients()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  handleSearch()
}

const loadPatients = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/patient', {
      params: {
        pageNum: pagination.page,
        pageSize: pagination.size,
        name: searchForm.name,
        idCard: searchForm.idCard,
        gender: searchForm.gender,
        minAge: searchForm.minAge,
        maxAge: searchForm.maxAge
      }
    })
    
    if (response.data.code === 200) {
      patientList.value = response.data.data.records || []
      total.value = response.data.data.total || 0
    } else {
      ElMessage.error('获取患者列表失败: ' + response.data.message)
    }
  } catch (error) {
    ElMessage.error('获取患者列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
  resetForm()
}

const editPatient = (patient) => {
  isEdit.value = true
  dialogVisible.value = true
  Object.keys(patientForm).forEach(key => {
    patientForm[key] = patient[key]
  })
}

const viewPatient = (patient) => {
  currentPatient.value = patient
  detailDialogVisible.value = true
}

const deletePatient = (patient) => {
  ElMessageBox.confirm(
    `确定要删除患者 ${patient.name} 吗？`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const response = await axios.delete(`/api/patient/${patient.id}`)
      if (response.data.code === 200) {
        ElMessage.success('删除成功')
        loadPatients()
      } else {
        ElMessage.error(response.data.message)
      }
    } catch (error) {
      ElMessage.error('删除失败: ' + error.message)
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const handleSubmit = () => {
  patientFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      
      try {
        const submitData = isEdit.value 
          ? { ...patientForm } 
          : {
              name: patientForm.name,
              gender: patientForm.gender,
              age: patientForm.age,
              bloodType: patientForm.bloodType,
              idCard: patientForm.idCard,
              phone: patientForm.phone,
              address: patientForm.address,
              allergies: patientForm.allergies,
              remarks: patientForm.remarks
            }

        const response = await axios.post('/api/patient', submitData)

        if (response.data.code === 200) {
          ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
          dialogVisible.value = false
          loadPatients()
        } else {
          ElMessage.error(response.data.message)
        }
      } catch (error) {
        ElMessage.error('保存失败: ' + error.message)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const resetForm = () => {
  if (patientFormRef.value) {
    patientFormRef.value.resetFields()
  }
  Object.keys(patientForm).forEach(key => {
    if (key === 'gender') {
      patientForm[key] = '男'
    } else {
      patientForm[key] = key === 'id' ? null : ''
    }
  })
}

const handleSelectionChange = (selection) => {
  selectedPatients.value = selection
}

const handleSizeChange = (newSize) => {
  pagination.size = newSize
  loadPatients()
}

const handleCurrentChange = (newPage) => {
  pagination.page = newPage
  loadPatients()
}

const exportPatients = () => {
  ElMessage.info('导出功能开发中...')
}

// 生命周期
onMounted(() => {
  loadPatients()
  
  // 检查URL参数，如果有action=add，自动打开新增患者对话框
  if (route.query.action === 'add') {
    setTimeout(() => {
      showAddDialog()
      ElMessage.success('已为您打开新增患者界面')
    }, 500) // 延迟500ms确保页面加载完成
  }
})
</script>

<style scoped>
.patient-management {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-info h1 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 1.8em;
}

.header-info p {
  margin: 0;
  color: #606266;
  font-size: 0.9em;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  margin: 0;
}

.table-card {
  background: white;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.patient-detail {
  margin: 20px 0;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-table) {
  margin-top: 0;
}

:deep(.el-descriptions) {
  margin-top: 0;
}
</style> 