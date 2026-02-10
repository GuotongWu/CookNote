import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 增加超时时间处理
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST 请求' });
  }

  const { images, image } = req.body; // 期望接收 images (数组) 或 image (单个)
  const imageList = images || (image ? [image] : []);
  
  if (imageList.length === 0) {
    return res.status(400).json({ error: '未提供图片数据' });
  }

  // 从 Vercel 后台环境变量中读取
  const apiKey = process.env.AI_API_KEY; 
  const baseUrl = process.env.AI_BASE_URL || 'https://api-inference.modelscope.cn/v1';
  const model = process.env.AI_MODEL || 'Qwen/Qwen3-VL-235B-A22B-Instruct';

  if (!apiKey) {
    return res.status(500).json({ error: '服务器配置错误：缺少 API_KEY' });
  }

  const prompt = `你是一个精准的菜谱数字化专家。请通过 OCR 识别文字和图像分析，将这些小红书风格的菜谱图转化为结构化数据。

### 输出规则：
1. **菜名 (name)**：提取图片标题或视觉重心中的菜肴名称，需简练。
2. **食材 (ingredients)**：
   - 提取所有主要食材。
   - **名称 (name)**：食材的名称。
   - **分类 (category)**：从以下固定分类中选其一：[肉禽类, 蔬菜类, 调料类, 海鲜类, 主食类, 其他]。
   - **重量 (amount)**：将文字描述（如“一勺”、“少许”）统一转换为**纯数字**（单位为克），如果没有标注则凭常识估算一个合理配比的克数。
3. **步骤 (steps)**：将复杂的描述提炼为 3-8 个短句组成的列表。

### 约束条件：
- 仅输出 JSON 格式，不要包含 Markdown 代码块 (\`\`\`)。
- 确保 JSON 结构如下：
{
  "name": "菜名",
  "ingredients": [{"name": "名称", "amount": 100, "category": "分类"}],
  "steps": ["第一步...", "第二步..."]
}`;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...imageList.map((img: string) => ({
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${img}`
                }
              }))
            ]
          }
        ],
        temperature: 0.1, // 降低随机性，保证 JSON 格式稳定
        response_format: { type: "json_object" } // 如果模型支持
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('ModelScope Error:', errorData);
      return res.status(response.status).json({ error: 'ModelScope 服务调用失败' });
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content;

    if (!content) {
      throw new Error('AI 返回内容为空');
    }

    // 尝试解析 JSON
    try {
      // 有时模型会返回带有 ```json 的字符串，需要处理一下
      const jsonStr = content.replace(/```json\n?|```/g, '').trim();
      const recipeData = JSON.parse(jsonStr);
      return res.status(200).json(recipeData);
    } catch (e) {
      console.error('JSON Parse Error:', content);
      return res.status(500).json({ error: 'AI 返回的格式无法解析' });
    }

  } catch (error) {
    console.error('Vercel API Error:', error);
    return res.status(500).json({ error: '服务器内部错误' });
  }
}
