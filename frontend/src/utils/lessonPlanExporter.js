import { Document, Paragraph, TextRun, Packer, WidthType, Table, TableRow, TableCell, BorderStyle } from 'docx';

/**
 * 将HTML格式的教案导出为Word文档
 * @param {string} htmlContent - HTML内容
 * @param {string} title - 文档标题（不会添加到文档中）
 * @returns {Promise<Blob>} word文档的blob对象
 */
export async function exportLessonPlanToDocx(htmlContent, title = '教案') {
  // 创建一个临时的容器来解析HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // 创建文档对象 - 注意没有添加标题到文档的headers部分
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            size: 24, 
            font: 'Microsoft YaHei'
          },
          paragraph: {
            spacing: { 
              line: 440, // 22磅行距 (22 * 20 = 440)
              before: 120, 
              after: 120 
            }
          }
        }
      }
    },
    sections: [{
      properties: {},
      children: processHtmlContent(tempDiv)
    }]
  });

  return await Packer.toBlob(doc);
}

/**
 * 处理HTML内容并转换为docx元素
 * @param {Element} container - 包含HTML内容的DOM元素
 * @returns {Array} docx元素数组
 */
function processHtmlContent(container) {
  // 如果容器为空，返回一个默认段落
  if (!container) {
    return [new Paragraph({ text: '内容无法解析' })];
  }

  const docElements = [];
  
  try {
    // 查找表格元素
    const table = container.querySelector('table');
    if (table) {
      // 如果找到表格，创建docx表格
      const tableRows = [];
      
      // 处理所有表格行
      const rows = table.querySelectorAll('tr');
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const cells = [];
        
        // 处理行中的所有单元格
        const tableCells = row.querySelectorAll('th, td');
        for (let j = 0; j < tableCells.length; j++) {
          const cell = tableCells[j];
          
          // 获取rowspan和colspan
          const rowSpan = parseInt(cell.getAttribute('rowspan')) || 1;
          const colSpan = parseInt(cell.getAttribute('colspan')) || 1;
          
          // 处理单元格内容
          const cellContent = [];
          
          // 首先处理带有<br>标签的内容
          const brParts = cell.innerHTML.split(/<br\s*\/?>/i);
          
          brParts.forEach(part => {
            // 创建临时容器处理每一部分
            const partDiv = document.createElement('div');
            partDiv.innerHTML = part;
            
            // 获取文本内容并处理回车换行
            const textContent = partDiv.textContent;
            if (textContent) {
              // 处理文本中的换行符（\n），将每行文本作为单独段落
              const textLines = textContent.split('\n');
              textLines.forEach((line, index) => {
                if (line.trim()) {
                  cellContent.push(
                    new Paragraph({
                      children: [
                        new TextRun({ 
                          text: line.trim(),
                        })
                      ],
                      // 减小段落间距以消除额外的空行
                      spacing: { before: 0, after: 0 }
                    })
                  );
                }
                
                // 不再添加额外的空行段落
                // if (index < textLines.length - 1 && line.trim()) {
                //   cellContent.push(new Paragraph({ spacing: { before: 0, after: 0 } }));
                // }
              });
            }
          });
          
          // 确保单元格有内容
          if (cellContent.length === 0) {
            cellContent.push(new Paragraph({ text: '' }));
          }
          
          cells.push(
            new TableCell({
              children: cellContent,
              rowSpan: rowSpan,
              columnSpan: colSpan,
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 }
              }
            })
          );
        }
        
        if (cells.length > 0) {
          tableRows.push(new TableRow({ children: cells }));
        }
      }
      
      if (tableRows.length > 0) {
        docElements.push(
          new Table({
            rows: tableRows,
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            }
          })
        );
      }
    } else {
      // 如果没有表格，将所有文本内容处理为多个段落
      const textLines = container.textContent.trim().split('\n');
      textLines.forEach(line => {
        if (line.trim()) {
          docElements.push(
            new Paragraph({
              text: line.trim()
            })
          );
        }
      });
    }
  } catch (error) {
    console.error('处理HTML内容出错:', error);
    return [new Paragraph({ text: `处理错误: ${error.message}` })];
  }
  
  // 如果没有生成任何内容，添加一个空段落
  if (docElements.length === 0) {
    docElements.push(new Paragraph({ text: '无内容' }));
  }
  
  return docElements;
}
