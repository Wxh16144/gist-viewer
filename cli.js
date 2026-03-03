#!/usr/bin/env node
import dotenv from 'dotenv';
import fs from 'fs-extra';
import path from 'path';
import stringify from 'json-stringify-pretty-compact';
import { Octokit } from 'octokit';

// 加载.env文件
dotenv.config();

// 校验必填配置
const validateConfig = () => {
  if (!process.env.GITHUB_USERNAME) {
    console.error(`❌ 缺少必填配置：GITHUB_USERNAME`);
    console.error(`💡 请确保环境变量或 .env 文件中包含该配置`);
    process.exit(1);
  }
};

// 拉取 Gist 数据 (使用 Octokit)
async function fetchGistData(username, token) {
  try {
    const octokit = new Octokit({ 
      auth: token || undefined // 如果没有 Token 则匿名请求（受限）
    });

    console.log(`📡 正在连接 GitHub API 获取 ${username} 的 Gist...`);
    
    // 使用 paginate 自动处理分页，获取所有 Gist
    const gists = await octokit.paginate('GET /users/{username}/gists', {
      username: username,
      per_page: 100
    });

    return gists;
  } catch (error) {
    console.error(`❌ 拉取 Gist 数据失败：${error.message}`);
    if (error.status === 403 && !token) {
      console.error('💡 提示：匿名请求速率受限，请提供 GITHUB_TOKEN 以获取更多配额。');
    }
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
    // 优先读取 GITHUB_TOKEN (Actions默认)，其次 GH_TOKEN (CLI常用)，或者为空
    token: process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim() || '',
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
  
  // 使用 ISO 格式方便前端处理，或者保持原本的本地时间字符串
  // const lastUpdate = new Date().toISOString(); 
  const lastUpdate = new Date().toLocaleString('zh-CN');

  // 5. 准备路径
  const templatePath = path.resolve('./template.html');
  
  let outputPath;
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
    .replaceAll('{{GITHUB_USERNAME}}', config.username)
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