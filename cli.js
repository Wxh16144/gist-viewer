#!/usr/bin/env node
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import stringify from 'json-stringify-pretty-compact';

// 加载.env文件
dotenv.config();

// 校验必填配置
const validateConfig = () => {
  const required = ['GITHUB_USERNAME'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ 缺少必填配置：${missing.join(', ')}`);
    console.error(`💡 请复制 .env.template 为 .env 并填写完整配置`);
    process.exit(1);
  }
};

// 拉取 Gist 数据
async function fetchGistData(username, token) {
  try {
    const headers = {};
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const response = await fetch(`https://api.github.com/users/${username}/gists`, { headers });
    if (!response.ok) {
      throw new Error(`GitHub API 请求失败：${response.status} ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error(`❌ 拉取 Gist 数据失败：${error.message}`);
    process.exit(1);
  }
}

// 读取本地 Gist 数据
async function getLocalGistData(filePath) {
  try {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`本地文件不存在：${absolutePath}`);
    }
    const data = await fs.readJson(absolutePath);
    return data;
  } catch (error) {
    console.error(`❌ 读取本地 Gist 数据失败：${error.message}`);
    process.exit(1);
  }
}

// 主流程
async function main() {
  // 1. 校验配置
  validateConfig();
  
  // 2. 读取配置
  const config = {
    username: process.env.GITHUB_USERNAME.trim(),
    token: process.env.GITHUB_TOKEN?.trim() || '',
    pageTitle: process.env.PAGE_TITLE?.trim() || `${process.env.GITHUB_USERNAME.trim()} 的 Gist 收藏集`,
    localFile: process.env.GIST_LOCAL_FILE?.trim() || ''
  };

  let gistData;

  if (config.localFile) {
    gistData = await getLocalGistData(config.localFile);
    console.log(`✅ 成功读取到 ${gistData.length} 条 Gist 数据 (本地模式)`);
  } else {
    // 3. 拉取 Gist 数据
    gistData = await fetchGistData(config.username, config.token);
    console.log(`✅ 成功拉取到 ${gistData.length} 条 Gist 数据`);
  }

  // 4. 压缩数据
  const compressedGistData = stringify(gistData, { maxLength: 120, indent: 0 });
  const lastUpdate = new Date().toLocaleString('zh-CN');

  // 5. 准备路径
  const templatePath = path.resolve('./template.html');
  
  let outputPath;
  // 检查命令行参数是否有输出路径
  const args = process.argv.slice(2);
  if (args.length > 0) {
    outputPath = path.resolve(args[0]);
  } else {
    const outputDir = path.resolve('./dist');
    outputPath = path.resolve(outputDir, 'gist-collection.html');
  }
  
  const outputDir = path.dirname(outputPath);

  // 6. 读取模板并替换变量
  if (!fs.existsSync(templatePath)) {
    console.error(`❌ 模板文件不存在：${templatePath}`);
    process.exit(1);
  }

  let templateContent = await fs.readFile(templatePath, 'utf8');
  templateContent = templateContent
    .replaceAll('{{PAGE_TITLE}}', config.pageTitle)
    .replaceAll('{{GIST_DATA}}', compressedGistData)
    .replaceAll('{{LAST_UPDATE}}', lastUpdate);

  // 7. 生成最终文件
  await fs.ensureDir(outputDir);
  await fs.writeFile(outputPath, templateContent, 'utf8');

  // 8. 输出成功信息
  console.log(`🎉 纯静态 HTML 生成成功：${outputPath}`);
}

// 执行主流程
main().catch(error => {
  console.error('❌ 程序执行失败：', error.message);
  process.exit(1);
});