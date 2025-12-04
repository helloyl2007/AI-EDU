import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, convertInchesToTwip, Packer, WidthType, Table, TableRow, TableCell, BorderStyle, Header, TableLayoutType } from 'docx';

// 统一过滤 Emoji 的辅助函数（优先使用 Unicode 属性，兼容降级到常见范围）
function stripEmoji(input) {
  if (!input) return input;
  try {
    // 移除所有表情符号及其变体选择符、ZWJ 连接等
    return input.replace(/\p{Extended_Pictographic}|\u200D|\uFE0F/gu, '');
  } catch (e) {
    // 回退：去除代理项表情、高位符号、ZWJ 与变体选择符
    return input.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|\u200D|\uFE0F|[\u2600-\u27BF]/g, '');
  }
}

export async function exportToDocx(content, includeAnswers = true) {
  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          run: {
            size: 24, // 12pt (小四)
            font: 'Microsoft YaHei' // 微软雅黑
          },
          paragraph: {
            spacing: { line: 288, before: 200, after: 200 } // 1.2 倍行距（240=1.0, 288=1.2, 360=1.5）
          }
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          run: {
            size: 28, // 14pt - 试题类型
            bold: true,
            font: 'Microsoft YaHei'
          },
          paragraph: {
            spacing: { before: 400, after: 200 }
          }
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          run: {
            size: 28, // 14pt - 题目
            bold: true,
            font: 'Microsoft YaHei'
          },
          paragraph: {
            spacing: { before: 300, after: 200 }
          }
        },
        {
          id: 'Answer',
          name: 'Answer',
          run: {
            size: 24, // 12pt - 答案和解析
            font: 'Microsoft YaHei',
            color: '0000FF'
          },
          paragraph: {
            indent: { left: convertInchesToTwip(0.5) },
            spacing: { line: 288, before: 200, after: 200 } // 1.2 倍行距
          }
        }
      ]
    },
    sections: [{
      properties: {},
      children: parseMarkdownToDocx(content, includeAnswers)
    }]
  });

  return await Packer.toBlob(doc);
}

function parseMarkdownToDocx(markdown, includeAnswers) {
  const lines = markdown.split('\n');
  const paragraphs = [];
  
  let skipAnswer = false;
  let inAnswerBlock = false;

  for (const line of lines) {
    // 处理答案部分
    if (!includeAnswers && line.startsWith('>')) {
      skipAnswer = true;
      continue;
    }

    if (line.trim() === '') {
      skipAnswer = false;
      inAnswerBlock = false;
      continue;
    }

    if (skipAnswer) continue;

    // 去除Markdown标记并添加适当的样式
    let cleanLine = line.trim();
    
    // 处理二级标题 (##)
    if (cleanLine.startsWith('##')) {
      cleanLine = cleanLine.replace(/^#+\s*/, '');
      paragraphs.push(
        new Paragraph({
          text: stripEmoji(cleanLine),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 400, after: 200 }
        })
      );
    }
    // 处理三级标题 (###)
    else if (cleanLine.startsWith('###')) {
      cleanLine = cleanLine.replace(/^#+\s*/, '');
      paragraphs.push(
        new Paragraph({
          text: stripEmoji(cleanLine),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 300, after: 200 }
        })
      );
    }
    // 处理答案和解析部分
    else if (cleanLine.startsWith('>')) {
      cleanLine = cleanLine.replace(/^>\s*/, '');
      inAnswerBlock = true;
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: stripEmoji(cleanLine),
              color: '0000FF'
            })
          ],
          style: 'Answer',
          spacing: { before: 100, after: 100 }
        })
      );
    }
    // 处理选项 - 使用12pt字号
    else if (cleanLine.match(/^[A-D]\.\s/)) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: stripEmoji(cleanLine),
              size: 24  // 12pt
            })
          ],
          indent: { left: convertInchesToTwip(0.25) },
          spacing: { before: 100, after: 100 }
        })
      );
    }
    // 处理普通段落 - 使用12pt字号
    else {
      paragraphs.push(
        new Paragraph({
          text: stripEmoji(cleanLine),
          style: 'Normal',  // 使用Normal样式确保12pt字号
          spacing: { before: 100, after: 100 }
        })
      );
    }
  }

  return paragraphs;
}

// 添加新函数用于导出HTML内容为docx (专用于教案)
export async function exportHtmlToDocx(htmlContent, title = '教案') {
  // 创建一个临时的容器来解析HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // 创建文档对象
  const doc = new Document({
    styles: {
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          run: {
            size: 24, // 12pt (小四)
            font: 'Microsoft YaHei' // 微软雅黑
          },
          paragraph: {
            spacing: { line: 288, before: 200, after: 200 } // 1.2 倍行距
          }
        },
        {
          id: 'Heading1',
          name: 'Heading 1',
          run: {
            size: 32, // 16pt
            bold: true,
            font: 'Microsoft YaHei'
          },
          paragraph: {
            spacing: { before: 400, after: 200 }
          }
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          run: {
            size: 28, // 14pt
            bold: true,
            font: 'Microsoft YaHei'
          },
          paragraph: {
            spacing: { before: 400, after: 200 }
          }
        },
        {
          id: 'TableHeading',
          name: 'Table Heading',
          run: {
            size: 24, // 12pt
            bold: true,
            font: 'Microsoft YaHei'
          }
        },
        {
          id: 'TableContent',
          name: 'Table Content',
          run: {
            size: 24, // 12pt
            font: 'Microsoft YaHei'
          }
        }
      ]
    },
    sections: [{
      properties: {},
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              text: stripEmoji(title),
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER
            })
          ]
        })
      },
      children: parseHtmlToDocx(tempDiv)
    }]
  });

  return await Packer.toBlob(doc);
}

// HTML解析为docx元素的函数
function parseHtmlToDocx(container) {
  if (!container) {
    console.error('传入的容器为空');
    return [new Paragraph({ text: stripEmoji('内容无法解析') })];
  }

  const docElements = [];
  
  try {
    // 处理子节点
    if (!container.childNodes || container.childNodes.length === 0) {
      return [new Paragraph({ text: stripEmoji(container.textContent || '内容为空') })];
    }
    
    // 内联节点到 TextRun 的简易转换（支持 strong/b、em/i、code）
    const inlineRunsFrom = (el) => {
      const runs = []
      if (!el) return runs
      const walk = (node, style = {}) => {
        if (!node) return
        if (node.nodeType === Node.TEXT_NODE) {
          const txt = (node.textContent || '').replace(/\s+/g, ' ').trim()
          if (txt) runs.push(new TextRun({ text: stripEmoji(txt), ...style }))
          return
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = node.tagName ? node.tagName.toLowerCase() : ''
          const nextStyle = { ...style }
          if (tag === 'strong' || tag === 'b') nextStyle.bold = true
          if (tag === 'em' || tag === 'i') nextStyle.italics = true
          if (tag === 'u') nextStyle.underline = {}
          if (tag === 'code') nextStyle.font = 'Courier New'
          // 递归子节点
          Array.from(node.childNodes || []).forEach(child => walk(child, nextStyle))
        }
      }
      walk(el)
      return runs
    }

    // 处理列表（无序/有序），用缩进 + 前缀符号近似表示
    const processList = (listEl, ordered = false, depth = 0) => {
      const paras = []
      const liNodes = listEl ? listEl.querySelectorAll(':scope > li') : []
      let idx = 1
      Array.from(liNodes).forEach(li => {
        const runs = inlineRunsFrom(li)
        const prefix = ordered ? `${idx++}. ` : '• '
        const children = [ new TextRun({ text: prefix }) ]
        if (runs.length) children.push(...runs)
        paras.push(new Paragraph({
          children,
          style: 'Normal',
          indent: { left: convertInchesToTwip(0.3 * (depth + 1)) },
          spacing: { before: 80, after: 80 }
        }))
        // 处理嵌套列表
        const nestedUls = li.querySelectorAll(':scope > ul')
        const nestedOls = li.querySelectorAll(':scope > ol')
        Array.from(nestedUls).forEach(ul => paras.push(...processList(ul, false, depth + 1)))
        Array.from(nestedOls).forEach(ol => paras.push(...processList(ol, true, depth + 1)))
      })
      return paras
    }

    Array.from(container.childNodes).forEach(node => {
      if (!node) return; // 跳过空节点
      
      // 文本节点
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent && node.textContent.trim()) {
          docElements.push(
            new Paragraph({
              text: stripEmoji(node.textContent.trim()),
              style: 'Normal'
            })
          );
        }
      } 
      // 元素节点
      else if (node.nodeType === Node.ELEMENT_NODE) {
        if (!node.tagName) return; // 检查是否有标签名
        
        const tagName = node.tagName.toLowerCase();
        
        // 标题处理
        if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
          docElements.push(
            new Paragraph({
              text: stripEmoji(node.textContent?.trim() || ''),
              heading: tagName === 'h1' ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 200 }
            })
          );
        }
        // 段落处理
        else if (tagName === 'p') {
          const runs = inlineRunsFrom(node)
          if (runs.length) {
            docElements.push(new Paragraph({ children: runs, style: 'Normal' }))
          } else {
            docElements.push(new Paragraph({ text: stripEmoji(node.textContent?.trim() || ''), style: 'Normal' }))
          }
        }
        // 列表处理（保留序号/圆点，并设置缩进）
        else if (tagName === 'ul' || tagName === 'ol') {
          const isOrdered = tagName === 'ol'
          const paras = processList(node, isOrdered, 0)
          if (paras.length) docElements.push(...paras)
        }
        // 表格处理
        else if (tagName === 'table') {
          try {
            const tableRows = [];
            let maxCols = 0;
            
            // 处理所有表格行
            const trElements = node.querySelectorAll('tr');
            if (trElements && trElements.length > 0) {
              // 第一轮预扫描，计算最大列数（考虑 colspan）
              Array.from(trElements).forEach(tr => {
                if (!tr) return;
                let colCount = 0;
                const cellElements = tr.querySelectorAll('th, td');
                if (cellElements && cellElements.length > 0) {
                  Array.from(cellElements).forEach(cell => {
                    if (!cell) return;
                    const colSpan = parseInt(cell.getAttribute('colspan')) || 1;
                    colCount += colSpan;
                  });
                }
                if (colCount > maxCols) maxCols = colCount;
              });
              if (maxCols <= 0) maxCols = 1;

              const contentWidth = convertInchesToTwip(6.5); // 约A4纸页内容宽度
              const perColWidth = Math.max(Math.floor(contentWidth / maxCols), convertInchesToTwip(0.6));

              // 第二轮生成表格
              Array.from(trElements).forEach(tr => {
                if (!tr) return;
                
                const tableCells = [];
                
                // 处理行中的单元格
                const cellElements = tr.querySelectorAll('th, td');
                if (cellElements && cellElements.length > 0) {
                  Array.from(cellElements).forEach(cell => {
                    if (!cell) return;
                    
                    const isHeader = cell.tagName.toLowerCase() === 'th';
                    const rowSpan = parseInt(cell.getAttribute('rowspan')) || 1;
                    const colSpan = parseInt(cell.getAttribute('colspan')) || 1;
                    const cellWidth = perColWidth * colSpan;
                    
                    // 处理单元格内容，支持HTML格式
                    const cellContent = [];
                    
                    try {
                      // 分割<br>标签，如果没有内容或innerHTML为空则跳过
                      if (!cell.innerHTML) {
                        cellContent.push(new Paragraph({ text: '' }));
                      } else {
                        const parts = cell.innerHTML.split(/<br\s*\/?>/i);
                        
                        parts.forEach((part, index) => {
                          // 创建临时元素来提取纯文本和格式
                          const tempDiv = document.createElement('div');
                          tempDiv.innerHTML = part;
                          
                          // 处理<strong>标签
                          const strongElements = tempDiv.querySelectorAll('strong');
                          if (strongElements && strongElements.length > 0) {
                            const paragraphChildren = [];
                            
                            // 过滤掉空文本节点
                            Array.from(tempDiv.childNodes || []).forEach(childNode => {
                              if (!childNode) return;
                              
                              if (childNode.nodeType === Node.TEXT_NODE) {
                                if (childNode.textContent && childNode.textContent.trim()) {
                                  paragraphChildren.push(
                                    new TextRun({
                                      text: stripEmoji(childNode.textContent.trim()),
                                    })
                                  );
                                }
                              } else if (childNode.tagName && childNode.tagName.toLowerCase() === 'strong') {
                                paragraphChildren.push(
                                  new TextRun({
                                    text: stripEmoji(childNode.textContent?.trim() || ''),
                                    bold: true
                                  })
                                );
                              }
                            });
                            
                            if (paragraphChildren.length > 0) {
                              cellContent.push(
                                new Paragraph({
                                  children: paragraphChildren,
                                  style: isHeader ? 'TableHeading' : 'TableContent'
                                })
                              );
                            }
                          } else {
                            // 处理<pre>标签
                            const preElements = tempDiv.querySelectorAll('pre');
                            if (preElements && preElements.length > 0) {
                              preElements.forEach(preEl => {
                                if (!preEl) return;
                                cellContent.push(
                                  new Paragraph({
                                    text: stripEmoji(preEl.textContent?.trim() || ''),
                                    style: 'Normal',
                                    spacing: { before: 0, after: 0 }
                                  })
                                );
                              });
                            } else if (tempDiv.textContent && tempDiv.textContent.trim()) {
                              // 普通文本
                              cellContent.push(
                                new Paragraph({
                                  text: stripEmoji(tempDiv.textContent.trim()),
                                  style: isHeader ? 'TableHeading' : 'TableContent',
                                  spacing: { before: 0, after: 0 }
                                })
                              );
                            }
                          }
                          
                          // 在部分之间添加空行，除了最后一部分
                          if (index < parts.length - 1) {
                            cellContent.push(new Paragraph({ text: '', spacing: { before: 80, after: 80 } }));
                          }
                        });
                      }
                    } catch (cellError) {
                      console.error('处理单元格内容时出错:', cellError);
                      cellContent.push(new Paragraph({ text: stripEmoji(cell.textContent?.trim() || '') }));
                    }
                    
                    // 如果没有内容，添加一个空段落
                    if (cellContent.length === 0) {
                      cellContent.push(new Paragraph({ text: '' }));
                    }
                    
                    tableCells.push(
                      new TableCell({
                        children: cellContent,
                        rowSpan: rowSpan,
                        columnSpan: colSpan,
                        width: { size: cellWidth, type: WidthType.DXA },
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1, color: "#000000" },
                          bottom: { style: BorderStyle.SINGLE, size: 1, color: "#000000" },
                          left: { style: BorderStyle.SINGLE, size: 1, color: "#000000" },
                          right: { style: BorderStyle.SINGLE, size: 1, color: "#000000" }
                        }
                      })
                    );
                  });
                }
                
                if (tableCells.length > 0) {
                  tableRows.push(new TableRow({ children: tableCells }));
                }
              });
            }
            
            if (tableRows.length > 0) {
              const contentWidth = convertInchesToTwip(6.5);
              const perColWidth = Math.max(Math.floor(contentWidth / Math.max(1, maxCols)), convertInchesToTwip(0.6));
              docElements.push(
                new Table({
                  rows: tableRows,
                  width: { size: contentWidth, type: WidthType.DXA },
                  columnWidths: new Array(Math.max(1, maxCols)).fill(perColWidth),
                  layout: TableLayoutType.FIXED,
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "#000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "#000000" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "#000000" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "#000000" }
                  }
                })
              );
              
              // 表格后添加空行
              docElements.push(new Paragraph({}));
            }
          } catch (tableError) {
            console.error('处理表格时出错:', tableError);
            docElements.push(new Paragraph({ text: stripEmoji(`[表格解析错误: ${tableError.message}]`) }));
          }
        }
        // 处理其他包含子节点的元素
        else if (node.hasChildNodes && node.hasChildNodes()) {
          try {
            const childElements = parseHtmlToDocx(node);
            if (childElements && childElements.length > 0) {
              docElements.push(...childElements);
            }
          } catch (childError) {
            console.error('处理子节点时出错:', childError);
          }
        }
      }
    });
  } catch (error) {
    console.error('HTML解析失败:', error);
    return [new Paragraph({ text: stripEmoji(`解析错误: ${error.message}`) })];
  }
  
  // 确保至少返回一个段落
  if (docElements.length === 0) {
    return [new Paragraph({ text: stripEmoji('内容为空') })];
  }
  
  return docElements;
}
