<template>
  <div class="statistics-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>统计报表</h2>
      <p class="page-description">系统运营数据统计分析与报表管理</p>
    </div>

    <!-- 快速统计卡片 -->
    <div class="stats-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon patients">
                <el-icon size="30"><User /></el-icon>
              </div>
              <div class="stats-info">
                <h3>{{ overviewData.patientCount || 0 }}</h3>
                <p>患者总数</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon doctors">
                <el-icon size="30"><Avatar /></el-icon>
              </div>
              <div class="stats-info">
                <h3>{{ overviewData.doctorCount || 0 }}</h3>
                <p>医生总数</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon medicines">
                <el-icon size="30"><FirstAidKit /></el-icon>
              </div>
              <div class="stats-info">
                <h3>{{ overviewData.medicineCount || 0 }}</h3>
                <p>药品种类</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon revenue">
                <el-icon size="30"><Money /></el-icon>
              </div>
              <div class="stats-info">
                <h3>￥{{ formatCurrency(overviewData.todayRevenue) || 0 }}</h3>
                <p>今日收入</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 数据图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>每周患者趋势</span>
                <el-button size="small" @click="refreshChartData">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </template>
            <div ref="patientTrendChart" style="width: 100%; height: 300px;"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>科室收入分布</span>
                <el-button size="small" @click="refreshChartData">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </template>
            <div ref="departmentRevenueChart" style="width: 100%; height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 搜索和操作区域 -->
    <el-card class="search-card">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input v-model="searchReportName" placeholder="按报表名称搜索" clearable>
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="8">
          <el-date-picker
            v-model="searchDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
             value-format="YYYY-MM-DD"
            clearable
            style="width: 100%;"
          ></el-date-picker>
        </el-col>
        <el-col :span="10">
          <el-button type="primary" @click="searchStatisticsRecords">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
           <el-button type="primary" @click="openAddDialog">
            <el-icon><Plus /></el-icon>
            添加报表
           </el-button>
           <el-button type="success" @click="generateReport">
            <el-icon><Download /></el-icon>
            生成报表
           </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 统计报表表格 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>统计报表列表</span>
          <span class="table-info">共 {{ pagination.total }} 条记录</span>
        </div>
      </template>
      
      <el-table 
        :data="statisticsList" 
        style="width: 100%;" 
        border 
        stripe
        v-loading="tableLoading"
        empty-text="暂无统计报表数据"
      >
        <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
        <el-table-column prop="reportName" label="报表名称" min-width="150">
          <template #default="scope">
            <el-tag type="primary" style="cursor: pointer" @click="viewReportDetail(scope.row)">
              {{ scope.row.reportName }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reportDate" label="报表日期" width="120" align="center">
          <template #default="scope">
            {{ formatDate(scope.row.reportDate) }}
          </template>
        </el-table-column>
        <el-table-column label="统计数据摘要" min-width="300">
          <template #default="scope">
            <div class="data-summary">
              <el-tag 
                v-for="(item, index) in getDataSummary(scope.row.dataJson)" 
                :key="index"
                size="small"
                :type="item.type"
                style="margin-right: 5px; margin-bottom: 3px;"
              >
                {{ item.label }}: {{ item.value }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" align="center">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="scope">
            <el-button size="small" type="primary" @click="viewReportDetail(scope.row)">
              <el-icon><View /></el-icon>
              查看
            </el-button>
            <el-button size="small" @click="handleEdit(scope.row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
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
    </el-card>

    <!-- 添加/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="800px">
      <el-form :model="currentStatistics" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="报表名称" prop="reportName">
          <el-input v-model="currentStatistics.reportName" placeholder="请输入报表名称"></el-input>
        </el-form-item>
        <el-form-item label="报表日期" prop="reportDate">
          <el-date-picker
              v-model="currentStatistics.reportDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              style="width: 100%;"
            ></el-date-picker>
        </el-form-item>
         <el-form-item label="统计数据" prop="dataJson">
          <el-input 
            v-model="currentStatistics.dataJson" 
            type="textarea" 
            :rows="8"
            placeholder="请输入JSON格式的统计数据"
          ></el-input>
          <div class="form-tip">
            <el-text type="info" size="small">请输入有效的JSON格式数据，如：{"total": 100, "new": 20}</el-text>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveStatistics" :loading="saveLoading">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 报表详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" :title="'报表详情 - ' + selectedReport.reportName" width="1000px">
      <div v-if="selectedReport.parsedData">
        <!-- 基本信息 -->
        <el-descriptions :column="3" border style="margin-bottom: 20px;">
          <el-descriptions-item label="报表名称">{{ selectedReport.reportName }}</el-descriptions-item>
          <el-descriptions-item label="报表日期">{{ formatDate(selectedReport.reportDate) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(selectedReport.createTime) }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 统计数据卡片展示 -->
        <div class="detail-content">
          <h4>统计数据详情</h4>
          <div class="data-cards">
            <el-row :gutter="15">
              <el-col 
                :span="getCardSpan(selectedReport.parsedData)" 
                v-for="(item, index) in getDetailCards(selectedReport.parsedData)" 
                :key="index"
                style="margin-bottom: 15px;"
              >
                <el-card class="detail-card" :class="item.type">
                  <div class="detail-card-content">
                    <div class="detail-card-icon">
                      <el-icon size="24" :color="item.color">
                        <component :is="item.icon"></component>
                      </el-icon>
                    </div>
                    <div class="detail-card-info">
                      <h3>{{ item.value }}</h3>
                      <p>{{ item.label }}</p>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>

          <!-- 如果有复杂数据，显示表格 -->
          <div v-if="getTableData(selectedReport.parsedData).length > 0" style="margin-top: 20px;">
            <h4>详细数据</h4>
            <el-table :data="getTableData(selectedReport.parsedData)" border>
              <el-table-column 
                v-for="column in getTableColumns(selectedReport.parsedData)" 
                :key="column.prop"
                :prop="column.prop" 
                :label="column.label"
                :formatter="column.formatter"
              ></el-table-column>
            </el-table>
          </div>

          <!-- 原始JSON数据（折叠展示） -->
          <el-collapse style="margin-top: 20px;">
            <el-collapse-item title="查看原始JSON数据" name="json">
              <div class="json-viewer">
                <pre>{{ JSON.stringify(selectedReport.parsedData, null, 2) }}</pre>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="exportReportData">导出数据</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { User, Avatar, FirstAidKit, Money, Search, Refresh, Plus, Download, View, Edit, Delete, TrendCharts, DataAnalysis, Histogram, Files } from '@element-plus/icons-vue';
import api from '../utils/request';
import * as echarts from 'echarts';

// 数据状态
const statisticsList = ref([]);
const pagination = ref({
  pageNum: 1,
  pageSize: 10,
  total: 0
});
const overviewData = ref({});
const tableLoading = ref(false);
const saveLoading = ref(false);

// 对话框状态
const dialogVisible = ref(false);
const detailDialogVisible = ref(false);
const dialogTitle = ref('');
const currentStatistics = ref({
  id: null,
  reportName: '',
  reportDate: null,
  dataJson: ''
});

const selectedReport = ref({});

// 搜索相关
const searchReportName = ref('');
const searchDateRange = ref(null);

// 表单引用和规则
const formRef = ref();
const formRules = {
  reportName: [
    { required: true, message: '请输入报表名称', trigger: 'blur' }
  ],
  reportDate: [
    { required: true, message: '请选择报表日期', trigger: 'change' }
  ],
  dataJson: [
    { required: true, message: '请输入统计数据', trigger: 'blur' },
    { validator: validateJSON, trigger: 'blur' }
  ]
};

// 图表引用
const patientTrendChart = ref();
const departmentRevenueChart = ref();
let patientChart = null;
let departmentChart = null;

// JSON验证器
function validateJSON(rule, value, callback) {
  if (!value) {
    callback(new Error('请输入统计数据'));
    return;
  }
  try {
    JSON.parse(value);
    callback();
  } catch (e) {
    callback(new Error('请输入有效的JSON格式'));
  }
}

// 获取系统概览数据
const fetchOverviewData = async () => {
  try {
    const response = await api.get('/api/statistics/overview');
    if (response.data.code === 200) {
      overviewData.value = response.data.data;
    }
  } catch (error) {
    console.error('获取概览数据失败:', error);
  }
};

// 获取统计报表列表
const fetchStatisticsList = async () => {
  tableLoading.value = true;
  try {
    const params = {
      pageNum: pagination.value.pageNum,
      pageSize: pagination.value.pageSize,
      reportName: searchReportName.value,
    };

    if (searchDateRange.value && searchDateRange.value.length === 2) {
      params.startDate = searchDateRange.value[0];
      params.endDate = searchDateRange.value[1];
    }

    const response = await api.get('/api/statistics', { params });

    if (response.data.code === 200) {
      statisticsList.value = response.data.data.records;
      pagination.value.total = response.data.data.total;
      
      // 更新图表数据
      await updateChartsData();
    } else {
      ElMessage.error('获取统计报表失败: ' + response.data.message);
    }
  } catch (error) {
    ElMessage.error('获取统计报表失败: ' + error.message);
  } finally {
    tableLoading.value = false;
  }
};

// 初始化图表
const initCharts = async () => {
  await nextTick();
  
  if (patientTrendChart.value) {
    patientChart = echarts.init(patientTrendChart.value);
  }
  
  if (departmentRevenueChart.value) {
    departmentChart = echarts.init(departmentRevenueChart.value);
  }
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    patientChart?.resize();
    departmentChart?.resize();
  });
};

// 更新图表数据
const updateChartsData = async () => {
  if (!statisticsList.value.length) return;
  
  // 寻找患者趋势数据
  const weeklyData = statisticsList.value.find(item => 
    item.reportName.includes('患者趋势') || item.reportName.includes('每周')
  );
  
  if (weeklyData && patientChart) {
    try {
      const data = JSON.parse(weeklyData.dataJson);
      if (data.week_data) {
        const days = data.week_data.map(item => item.day);
        const patients = data.week_data.map(item => item.patients);
        
        const option = {
          title: {
            text: '每周患者数量趋势',
            left: 'center',
            textStyle: { fontSize: 14 }
          },
          tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c}人'
          },
          xAxis: {
            type: 'category',
            data: days,
            axisLabel: { fontSize: 12 }
          },
          yAxis: {
            type: 'value',
            name: '患者数',
            axisLabel: { fontSize: 12 }
          },
          series: [{
            name: '患者数',
            type: 'line',
            data: patients,
            smooth: true,
            areaStyle: {
              opacity: 0.3
            },
            itemStyle: {
              color: '#409EFF'
            },
            lineStyle: {
              width: 3
            }
          }],
          grid: {
            left: '50',
            right: '20',
            bottom: '20',
            top: '50'
          }
        };
        
        patientChart.setOption(option);
      }
    } catch (e) {
      console.error('患者趋势数据解析失败:', e);
    }
  }
  
  // 寻找科室收入数据
  const departmentData = statisticsList.value.find(item => 
    item.reportName.includes('科室收入') || item.reportName.includes('科室')
  );
  
  if (departmentData && departmentChart) {
    try {
      const data = JSON.parse(departmentData.dataJson);
      if (data.departments && Array.isArray(data.departments)) {
        const names = data.departments.map(item => item.name);
        const revenues = data.departments.map(item => item.revenue);
        
        const option = {
          title: {
            text: '科室收入分布',
            left: 'center',
            textStyle: { fontSize: 14 }
          },
          tooltip: {
            trigger: 'item',
            formatter: '{b}: ￥{c} ({d}%)'
          },
          legend: {
            orient: 'vertical',
            left: 'left',
            top: 'middle',
            textStyle: { fontSize: 10 }
          },
          series: [{
            name: '科室收入',
            type: 'pie',
            radius: ['30%', '70%'],
            center: ['60%', '50%'],
            data: names.map((name, index) => ({
              name: name,
              value: revenues[index]
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            label: {
              formatter: '{b}\n￥{c}',
              fontSize: 10
            }
          }]
        };
        
        departmentChart.setOption(option);
      }
    } catch (e) {
      console.error('科室收入数据解析失败:', e);
    }
  }
};

// 刷新图表数据
const refreshChartData = () => {
  updateChartsData();
  ElMessage.success('图表数据已刷新');
};

// 搜索统计报表
const searchStatisticsRecords = () => {
  pagination.value.pageNum = 1;
  fetchStatisticsList();
};

// 重置搜索
const resetSearch = () => {
  searchReportName.value = '';
  searchDateRange.value = null;
  searchStatisticsRecords();
};

// 分页处理
const handleSizeChange = (newSize) => {
  pagination.value.pageSize = newSize;
  fetchStatisticsList();
};

const handleCurrentChange = (newPage) => {
  pagination.value.pageNum = newPage;
  fetchStatisticsList();
};

// 打开添加对话框
const openAddDialog = () => {
  dialogTitle.value = '添加统计报表';
  currentStatistics.value = {
    id: null,
    reportName: '',
    reportDate: null,
    dataJson: ''
  };
  dialogVisible.value = true;
};

// 编辑报表
const handleEdit = (row) => {
  dialogTitle.value = '编辑统计报表';
  currentStatistics.value = { ...row };
  if (currentStatistics.value.reportDate) {
    const date = new Date(currentStatistics.value.reportDate);
    currentStatistics.value.reportDate = date.toISOString().split('T')[0];
  }
  dialogVisible.value = true;
};

// 保存统计报表
const saveStatistics = async () => {
  if (!formRef.value) return;
  
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  saveLoading.value = true;
  try {
    const submitData = currentStatistics.value.id
      ? { ...currentStatistics.value }
      : {
          reportName: currentStatistics.value.reportName,
          reportDate: currentStatistics.value.reportDate,
          dataJson: currentStatistics.value.dataJson,
        };

    const response = await api.post('/api/statistics', submitData);

    if (response.data.code === 200) {
      ElMessage.success(dialogTitle.value === '添加统计报表' ? '添加成功' : '更新成功');
      dialogVisible.value = false;
      fetchStatisticsList();
    } else {
      ElMessage.error(response.data.message || '保存失败');
    }
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message);
  } finally {
    saveLoading.value = false;
  }
};

// 删除报表
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定删除报表"${row.reportName}"吗？此操作不可恢复！`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const response = await api.delete(`/api/statistics/${row.id}`);
      if (response.data.code === 200) {
        ElMessage.success('删除成功');
        fetchStatisticsList();
      } else {
        ElMessage.error(response.data.message || '删除失败');
      }
    } catch (error) {
      ElMessage.error('删除失败: ' + error.message);
    }
  }).catch(() => {
    ElMessage.info('已取消删除');
  });
};

// 查看报表详情
const viewReportDetail = (row) => {
  selectedReport.value = { ...row };
  try {
    selectedReport.value.parsedData = JSON.parse(row.dataJson);
  } catch (e) {
    selectedReport.value.parsedData = null;
    ElMessage.warning('报表数据格式错误，无法解析');
  }
  detailDialogVisible.value = true;
};

// 生成报表
const generateReport = () => {
  ElMessage.info('报表生成功能开发中...');
};

// 导出报表数据
const exportReportData = () => {
  if (!selectedReport.value.parsedData) {
    ElMessage.warning('无法导出，数据格式错误');
    return;
  }
  
  const dataStr = JSON.stringify(selectedReport.value.parsedData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${selectedReport.value.reportName}_${formatDate(selectedReport.value.reportDate)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success('数据导出成功');
};

// 获取数据摘要（表格中显示）
const getDataSummary = (dataJson) => {
  if (!dataJson) return [];
  
  try {
    const data = JSON.parse(dataJson);
    const summary = [];
    
    // 处理不同类型的数据
    Object.keys(data).forEach(key => {
      const value = data[key];
      if (typeof value === 'number') {
        summary.push({
          label: getKeyLabel(key),
          value: formatValue(key, value),
          type: getTagType(key)
        });
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // 处理对象类型数据，取前2个
        const objKeys = Object.keys(value).slice(0, 2);
        objKeys.forEach(objKey => {
          summary.push({
            label: getKeyLabel(objKey),
            value: formatValue(objKey, value[objKey]),
            type: 'info'
          });
        });
      }
    });
    
    return summary.slice(0, 4); // 最多显示4个
  } catch (e) {
    return [{ label: '数据格式', value: '错误', type: 'danger' }];
  }
};

// 获取详情卡片数据
const getDetailCards = (data) => {
  const cards = [];
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (typeof value === 'number') {
      cards.push({
        label: getKeyLabel(key),
        value: formatValue(key, value),
        icon: getIconByKey(key),
        color: getColorByKey(key),
        type: getCardType(key)
      });
    }
  });
  
  return cards;
};

// 获取表格数据
const getTableData = (data) => {
  const tableData = [];
  
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      tableData.push(...value);
    }
  });
  
  return tableData;
};

// 获取表格列配置
const getTableColumns = (data) => {
  const tableData = getTableData(data);
  if (tableData.length === 0) return [];
  
  const columns = [];
  const firstItem = tableData[0];
  
  Object.keys(firstItem).forEach(key => {
    columns.push({
      prop: key,
      label: getKeyLabel(key),
      formatter: (row, column, cellValue) => formatValue(key, cellValue)
    });
  });
  
  return columns;
};

// 获取卡片跨度
const getCardSpan = (data) => {
  const cardCount = getDetailCards(data).length;
  if (cardCount <= 2) return 12;
  if (cardCount <= 4) return 6;
  return 4;
};

// 工具函数
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN');
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
};

const formatCurrency = (amount) => {
  if (!amount) return '0';
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const getKeyLabel = (key) => {
  const labelMap = {
    total_patients: '总患者数',
    new_patients: '新患者',
    returning_patients: '复诊患者',
    total_doctors: '总医生数',
    active_doctors: '活跃医生',
    total_appointments: '总预约数',
    completed_appointments: '完成预约',
    average_consultation_time: '平均诊疗时间',
    total_medicines: '药品种类',
    medicines_sold: '药品销量',
    total_revenue: '总收入',
    consultation_fees: '诊疗费',
    medicine_revenue: '药品收入',
    treatment_fees: '治疗费',
    confirmed: '已确认',
    pending: '待处理',
    cancelled: '已取消',
    completion_rate: '完成率',
    low_stock: '库存不足',
    out_of_stock: '缺货',
    normal_rate: '正常率',
    abnormal_rate: '异常率',
    total_metrics: '总指标数',
    name: '名称',
    revenue: '收入',
    patients: '患者数',
    appointments: '预约数',
    day: '日期'
  };
  return labelMap[key] || key;
};

const formatValue = (key, value) => {
  if (key.includes('revenue') || key.includes('fees') || key.includes('收入')) {
    return `￥${formatCurrency(value)}`;
  }
  if (key.includes('rate') || key.includes('率')) {
    return `${value}%`;
  }
  if (key.includes('time') || key.includes('时间')) {
    return `${value}分钟`;
  }
  return value;
};

const getTagType = (key) => {
  if (key.includes('new') || key.includes('新')) return 'success';
  if (key.includes('total') || key.includes('总')) return 'primary';
  if (key.includes('revenue') || key.includes('收入')) return 'warning';
  return '';
};

const getIconByKey = (key) => {
  if (key.includes('patient') || key.includes('患者')) return 'User';
  if (key.includes('doctor') || key.includes('医生')) return 'Avatar';
  if (key.includes('medicine') || key.includes('药品')) return 'FirstAidKit';
  if (key.includes('revenue') || key.includes('收入')) return 'Money';
  if (key.includes('appointment') || key.includes('预约')) return 'Calendar';
  return 'DataAnalysis';
};

const getColorByKey = (key) => {
  if (key.includes('patient') || key.includes('患者')) return '#67c23a';
  if (key.includes('doctor') || key.includes('医生')) return '#409eff';
  if (key.includes('medicine') || key.includes('药品')) return '#e6a23c';
  if (key.includes('revenue') || key.includes('收入')) return '#f56c6c';
  return '#909399';
};

const getCardType = (key) => {
  if (key.includes('new') || key.includes('新')) return 'success';
  if (key.includes('revenue') || key.includes('收入')) return 'warning';
  return 'primary';
};

// 页面加载
onMounted(async () => {
  await fetchOverviewData();
  await fetchStatisticsList();
  await initCharts();
});
</script>

<style scoped>
.statistics-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
  font-size: 24px;
}

.page-description {
  margin: 8px 0 0 0;
  color: #909399;
  font-size: 14px;
}

/* 统计卡片样式 */
.stats-overview {
  margin-bottom: 20px;
}

.stats-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stats-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stats-icon {
  color: white;
  padding: 15px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-icon.patients { background: linear-gradient(135deg, #67c23a, #85ce61); }
.stats-icon.doctors { background: linear-gradient(135deg, #409eff, #66b1ff); }
.stats-icon.medicines { background: linear-gradient(135deg, #e6a23c, #f0c065); }
.stats-icon.revenue { background: linear-gradient(135deg, #f56c6c, #f78989); }

.stats-info h3 {
  font-size: 2em;
  margin: 0 0 5px 0;
  color: #303133;
  font-weight: 600;
}

.stats-info p {
  margin: 0;
  color: #909399;
  font-size: 0.9em;
}

/* 图表区域 */
.charts-section {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

/* 搜索卡片 */
.search-card {
  margin-bottom: 20px;
}

/* 表格卡片 */
.table-card {
  margin-bottom: 20px;
}

.table-info {
  font-size: 14px;
  color: #909399;
}

.data-summary {
  line-height: 1.8;
}

/* 表单样式 */
.form-tip {
  margin-top: 5px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 详情对话框 */
.detail-content {
  margin-top: 20px;
}

.detail-content h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.data-cards {
  margin-bottom: 20px;
}

.detail-card {
  height: 100%;
  cursor: default;
  transition: transform 0.2s ease;
}

.detail-card:hover {
  transform: translateY(-2px);
}

.detail-card-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.detail-card-icon {
  flex-shrink: 0;
}

.detail-card-info h3 {
  font-size: 1.8em;
  margin: 0 0 5px 0;
  color: #303133;
  font-weight: 600;
}

.detail-card-info p {
  margin: 0;
  color: #909399;
  font-size: 0.9em;
}

.detail-card.success {
  border-left: 4px solid #67c23a;
}

.detail-card.warning {
  border-left: 4px solid #e6a23c;
}

.detail-card.primary {
  border-left: 4px solid #409eff;
}

.json-viewer {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.json-viewer pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #495057;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-content {
    flex-direction: column;
    text-align: center;
  }
  
  .stats-icon {
    margin-bottom: 10px;
  }
}

/* 加载状态 */
.el-table :deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.8);
}
</style> 