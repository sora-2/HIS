<template>
  <div class="user-manage">
    <el-card>
      <div class="header">
        <span class="title">用户管理</span>
        <el-button type="primary" @click="handleAdd">新增用户</el-button>
      </div>
      <el-table :data="userList" style="width: 100%" v-loading="loading">
        <el-table-column v-if="false" prop="id" label="ID" width="80" />
        <el-table-column prop="workNumber" label="工号" />
        <el-table-column prop="userName" label="姓名" />
        <el-table-column prop="roleName" label="角色" />
        <el-table-column label="状态">
          <template #default="scope">
            <el-button :type="scope.row.status === 1 ? 'success' : 'info'"
                       size="small"
                       @click="toggleStatus(scope.row)">
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-if="total > 0"
        style="margin-top: 16px; text-align: right;"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :current-page="pageNum"
        :page-size="pageSize"
        :page-sizes="[5, 10, 20, 50]"
        :total="total"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </el-card>
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="400px">
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="80px">
        <el-form-item label="工号" prop="workNumber">
          <el-input v-model="form.workNumber" :disabled="dialogType==='edit'" />
        </el-form-item>
        <el-form-item label="姓名" prop="userName">
          <el-input v-model="form.userName" />
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="form.roleId" placeholder="请选择角色">
            <el-option v-for="role in roleList" :key="role.id" :label="role.roleName" :value="role.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible=false">取消</el-button>
        <el-button type="primary" @click="handleDialogOk">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const userList = ref([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogType = ref('add') // add/edit
const form = ref({ id: '', workNumber: '', userName: '', roleId: '' })
const formRef = ref(null)
const formRules = {
  workNumber: [{ required: true, message: '请输入工号', trigger: 'blur' }],
  userName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  roleId: [{ required: true, message: '请选择角色', trigger: 'change' }]
}
const roleList = ref([])

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await axios.get(`/api/admin/user/getUserByPage/${pageNum.value}/${pageSize.value}`)
    if (res.data.code === 200) {
      userList.value = res.data.data.list || []
      total.value = res.data.data.total || 0
    } else {
      ElMessage.error(res.data.message)
    }
  } catch (e) {
    ElMessage.error('网络错误或服务器异常')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (val) => {
  pageNum.value = val
  fetchUsers()
}

const handleSizeChange = (val) => {
  pageSize.value = val
  pageNum.value = 1
  fetchUsers()
}

const fetchRoles = async () => {
  try {
    const res = await axios.get('/api/admin/user/getAllRole')
    if (res.data.code === 200) {
      roleList.value = res.data.data || []
    } else {
      roleList.value = []
    }
  } catch (e) {
    roleList.value = []
  }
}

onMounted(() => {
  fetchUsers()
})

const handleAdd = async () => {
  dialogType.value = 'add'
  dialogTitle.value = '新增用户'
  form.value = { id: '', workNumber: '', userName: '', roleId: '' }
  await fetchRoles()
  dialogVisible.value = true
}
const handleEdit = async (row) => {
  dialogType.value = 'edit'
  dialogTitle.value = '编辑用户'
  await fetchRoles()
  let roleId = row.roleId
  if (!roleId && row.roleName) {
    // 通过roleName查找roleId
    const found = roleList.value.find(r => r.roleName === row.roleName)
    roleId = found ? found.id : ''
  }
  form.value = { id: row.id, workNumber: row.workNumber, userName: row.userName, roleId }
  dialogVisible.value = true
}
const handleDialogOk = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      if (dialogType.value === 'add') {
        const { workNumber, userName, roleId } = form.value
        const res = await axios.post('/api/admin/user/addUser', { workNumber, userName, roleId })
        if (res.data.code !== 200) {
          ElMessage.error(res.data.message)
          return
        }
        ElMessage.success('新增成功')
      } else {
        const { id, workNumber, userName, roleId } = form.value
        const res = await axios.put('/api/admin/user/updateUserInfo', { id, workNumber, userName, roleId })
        if (res.data.code !== 200) {
          ElMessage.error(res.data.message)
          return
        }
        ElMessage.success('编辑成功')
      }
      dialogVisible.value = false
      fetchUsers()
    } catch (e) {
      ElMessage.error('操作失败')
    }
  })
}
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该用户吗？', '提示', { type: 'warning' })
    .then(async () => {
      try {
        const res = await axios.delete(`/api/admin/user/deleteUserById/${row.id}`)
        if (res.data.code !== 200) {
          ElMessage.error(res.data.message)
          return
        }
        ElMessage.success('删除成功')
        fetchUsers()
      } catch (e) {
        ElMessage.error('删除失败')
      }
    })
}
const toggleStatus = async (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  try {
    const res = await axios.get(`/api/admin/user/startOrStop/${row.id}/${newStatus}`)
    if (res.data.code !== 200) {
      ElMessage.error(res.data.message)
      return
    }
    ElMessage.success(newStatus === 1 ? '已启用' : '已禁用')
    fetchUsers()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}
</script>

<style scoped>
.user-manage {
  padding: 24px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.title {
  font-size: 20px;
  font-weight: bold;
}
</style> 