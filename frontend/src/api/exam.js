import request from '@/utils/request'

/**
 * 生成试题
 * @param {Object} data 试题生成参数
 * @param {Array} data.scopeSelection 学科范围选择
 * @param {Array} data.selectedTopics 选中的考查范围
 * @param {String} data.requirements 具体要求
 * @param {Object} data.questionTypes 题目类型及数量
 * @returns {Promise}
 */
export function generateExam(data) {
  return request({
    url: '/exam/generate',
    method: 'post',
    data,
    responseType: 'text', 
    headers: {
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
