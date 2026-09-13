// 全局状态
let appState = {
  data: null,
  status: 'loading', // loading / success / error / empty
  currentFilter: 'all'
}

// 1. 加载本地JSON数据
async function loadData() {
  try {
    const res = await fetch('./data/sports.json')
    if (!res.ok) throw new Error('加载失败')
    const data = await res.json()
    
    if (data.length === 0) {
      appState.status = 'empty'
    } else {
      appState.data = data
      appState.status = 'success'
    }
  } catch (err) {
    appState.status = 'error'
  }
  render()
}

// 2. 渲染全部内容
function render() {
  // 处理三种异常状态
  if (appState.status === 'loading') {
    $('#statusArea').text('数据加载中，请稍候...')
    return
  }
  if (appState.status === 'error') {
    $('#statusArea').text('数据加载失败，请检查文件路径')
    return
  }
  if (appState.status === 'empty') {
    $('#statusArea').text('暂无赛事数据')
    return
  }

  // 加载成功后隐藏状态提示
  $('#statusArea').hide()

  // 筛选当前展示数据
  let showData = appState.data
  if (appState.currentFilter !== 'all') {
    showData = appState.data.filter(item => item.type === appState.currentFilter)
  }

  // 渲染统计卡片
  $('#cardArea').empty()
  $('#cardArea').append(`<div class="card">总赛事数：${showData.length} 场</div>`)
  const totalAudience = showData.reduce((sum, i) => sum + i.audience, 0)
  $('#cardArea').append(`<div class="card">总观赛人次：${totalAudience} 万</div>`)

  // 渲染ECharts柱状图：各赛事观赛人次排行
  const echartDom = document.getElementById('echartBox')
  const myEchart = echarts.init(echartDom)
  myEchart.setOption({
    title: { 
      text: '热门赛事观赛人次排行', 
      subtext: '单位：万人次 | 数据来源：模拟体育赛事统计',
      left: 'center'
    },
    xAxis: { 
      type: 'category', 
      data: showData.map(i => i.name),
      axisLabel: { rotate: 15 }
    },
    yAxis: { type: 'value', name: '万人次' },
    series: [{ type: 'bar', data: showData.map(i => i.audience), color: '#5470c6' }]
  })

  // 渲染缩小版Chart.js饼图：赛事类型占比
  const typeMap = {}
  showData.forEach(i => {
    typeMap[i.type] = (typeMap[i.type] || 0) + 1
  })
  // 先销毁旧图表避免重复报错
  if (window.myPieChart) window.myPieChart.destroy()
  window.myPieChart = new Chart(document.getElementById('chartjsBox'), {
    type: 'pie',
    data: {
      labels: Object.keys(typeMap),
      datasets: [{ 
        data: Object.values(typeMap),
        // 饼图尺寸强制缩小
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      layout: {
        padding: 20
      },
      plugins: {
        legend: {
          position: 'bottom' // 图例放底部，节省空间
        },
        title: { 
          display: true, 
          text: '赛事类型分布 | 数据来源：模拟体育赛事统计',
          font: { size: 14 }
        }
      }
    }
  })
}

// jQuery实现筛选交互
$('.filter-btn').on('click', function () {
  $('.filter-btn').css({
    'background': '#ecf0f1',
    'color': '#333'
  })
  $(this).css({
    'background': '#5470c6',
    'color': '#fff'
  })
  appState.currentFilter = $(this).data('type')
  render()
})

// 窗口大小变化时自动重绘图表
window.addEventListener('resize', () => {
  if (appState.status === 'success') {
    echarts.init(document.getElementById('echartBox')).resize()
  }
})


// 启动程序
loadData()
