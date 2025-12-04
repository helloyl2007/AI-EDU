<template>
  <div class="user-management">
    <div class="header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加用户
      </el-button>
    </div>
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
    />
    <el-table :data="users" style="width: 100%">
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="mobile" label="手机号" />
      <el-table-column prop="roles" label="角色">
        <template #default="scope">
          {{ scope.row.roles === 'admin' ? '管理员' : '教师' }}
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="注册时间">
        <template #default="scope">
          {{ new Date(scope.row.created_at).toLocaleString() }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-tag :type="scope.row.status == '1' ? 'success' : 'warning'">
            {{ scope.row.status == '1' ? '已审核' : '未审核' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260">
        <template #default="scope">
          <div class="operation-buttons">
            <el-button 
              link
              type="info" 
              @click="handleEdit(scope.row)"
            >
              <el-icon><Edit /></el-icon>
              修改
            </el-button>
            <el-button 
              link
              type="danger" 
              @click="handleDelete(scope.row)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
            <el-button 
              v-if="scope.row.status == '0'"
              link
              type="warning" 
              @click="handleApprove(scope.row)"
            >
              <el-icon><Check /></el-icon>
              审核通过
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 修改用户弹窗 -->
    <el-dialog v-model="dialogVisible" title="修改用户信息" width="500px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="editForm.password" type="password" placeholder="不修改请留空" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.mobile" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="editForm.roles">
            <el-option label="教师" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="editForm.status">
            <el-option label="通过审核" value="1" />
            <el-option label="撤消审核" value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加用户弹窗 -->
    <el-dialog v-model="addDialogVisible" title="添加用户" width="500px">
      <el-form :model="addForm" label-width="100px">
        <el-form-item label="用户名" required>
          <el-input v-model="addForm.username" />
        </el-form-item>
        <el-form-item label="密码" required>
          <el-input v-model="addForm.password" type="password" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="addForm.mobile" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="addForm.roles">
            <el-option label="教师" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdd" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Check } from '@element-plus/icons-vue'

// 使用环境变量
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const users = ref([])
const error = ref('')

const fetchUsers = async () => {
  try {
    error.value = ''
    const response = await axios.get('/api/auth/users', {
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    users.value = response.data
  } catch (err) {
    error.value = '获取用户列表失败: ' + (err.response?.data?.detail || err.message)
    ElMessage.error(error.value)
  }
}

onMounted(() => {
  fetchUsers()
})

const dialogVisible = ref(false)
const submitLoading = ref(false)
const editForm = ref({})
const currentUserId = ref(null)

const handleEdit = (row) => {
  currentUserId.value = row.id
  editForm.value = {
    username: row.username,
    password: '',
    mobile: row.mobile,
    roles: row.roles,
    status: row.status
  }
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确认删除该用户？', '警告', {
      type: 'warning'
    })
    await axios.delete(`/api/auth/users/${row.id}`, {
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    ElMessage.success('删除成功')
    fetchUsers()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败: ' + (err.response?.data?.detail || err.message))
    }
  }
}

const submitEdit = async () => {
  try {
    submitLoading.value = true
    await axios.put(`/api/auth/users/${currentUserId.value}`, editForm.value, {
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    ElMessage.success('更新成功')
    dialogVisible.value = false
    fetchUsers()
  } catch (err) {
    ElMessage.error('更新失败: ' + (err.response?.data?.detail || err.message))
  } finally {
    submitLoading.value = false
  }
}

const handleApprove = async (row) => {
  try {
    await ElMessageBox.confirm('确认审核通过该用户？', '提示', {
      type: 'info'
    })
    await axios.put(`/api/auth/users/${row.id}/status`, null, {
      baseURL: API_BASE_URL,
      params: { status: '1' },
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    ElMessage.success('审核成功')
    fetchUsers()
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('审核失败: ' + (err.response?.data?.detail || err.message))
    }
  }
}

const addDialogVisible = ref(false)
const addForm = ref({
  username: '',
  password: '',
  mobile: '',
  roles: 'user'
})

const handleAdd = () => {
  addForm.value = {
    username: '',
    password: '',
    mobile: '',
    roles: 'user'
  }
  addDialogVisible.value = true
}

const submitAdd = async () => {
  try {
    submitLoading.value = true
    await axios.post('/api/auth/users', addForm.value, {
      baseURL: API_BASE_URL,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    ElMessage.success('添加成功')
    addDialogVisible.value = false
    fetchUsers()
  } catch (err) {
    ElMessage.error('添加失败: ' + (err.response?.data?.detail || err.message))
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.operation-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.operation-buttons .el-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.operation-buttons .el-icon {
  margin: 0;
}
</style>
