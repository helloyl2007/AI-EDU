
/**
 * 清理并验证JSON字符串
 * @param text 可能包含额外内容的JSON字符串
 * @returns 清理后的合法JSON字符串
 */
export function cleanAndValidateJSON(text: string): string {
  // 尝试找到第一个 { 和最后一个 }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('No valid JSON object found in the text');
  }

  // 提取可能的JSON部分
  let jsonCandidate = text.substring(firstBrace, lastBrace + 1);

  // 移除可能的Markdown代码块标记
  jsonCandidate = jsonCandidate.replace(/```json\s*|```\s*$/g, '');
  
  // 尝试解析JSON以验证其有效性
  try {
    JSON.parse(jsonCandidate);
    return jsonCandidate;
  } catch (e) {
    throw new Error(`Invalid JSON format: ${e.message}`);
  }
}

/**
 * 验证PPT内容的数据结构
 * @param content PPT内容对象
 * @returns boolean
 */
export function validatePPTContent(content: any): boolean {
  if (!content) return false;
  
  // 检查基本结构
  if (typeof content !== 'object') return false;
  if (!content.topic || typeof content.topic !== 'string') return false;
  if (!Array.isArray(content.pages)) return false;
  
  // 检查每个页面的结构
  return content.pages.every((page: any) => {
    if (!page.title || typeof page.title !== 'string') return false;
    if (!Array.isArray(page.pages)) return false;
    
    // 检查子页面结构
    return page.pages.every((subPage: any) => {
      if (!subPage.sub_title || typeof subPage.sub_title !== 'string') return false;
      if (!Array.isArray(subPage.desc)) return false;
      if (!Array.isArray(subPage.contents)) return false;
      return true;
    });
  });
}
