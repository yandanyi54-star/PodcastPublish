/**
 * callAI 功能测试
 *
 * 注意：callAI() 已提取到 src/callAI.js。
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callAI } from '../src/callAI.js';

// ============================================================
// 行为契约
// ============================================================
//
// callAI(systemPrompt, userPrompt, deps) → string | null
//
// 参数:
//   systemPrompt - 系统提示词（设定 AI 角色/行为）
//   userPrompt   - 用户输入内容
//   deps         - 依赖注入 { key, baseURL, model, loading, showToast }
//
// 返回值:
//   string  - AI 返回的文本内容
//   null    - 失败（无 Key、网络错误、超时、状态码错误）
//
// 副作用:
//   - 设置 deps.loading.value = true / false
//   - 显示 toast 提示（成功/失败）
//   - 30s 超时自动 abort
//   - 支持 AbortController 取消

// 创建模拟依赖
function createDeps(overrides = {}) {
  const loading = { value: false };
  const key = { value: 'test-key' };
  const baseURL = { value: 'https://api.test.com/v1' };
  const model = { value: 'test-model' };
  const toastMessages = [];

  return {
    key,
    baseURL,
    model,
    loading,
    showToast: (msg, type) => { toastMessages.push({ msg, type }); },
    getToastMessages: () => toastMessages,
    ...overrides
  };
}

describe('callAI', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    vi.useFakeTimers();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
  });

  // ---- P0 前置条件校验 ----

  it('AI Key 为空时直接返回 null', async () => {
    const deps = createDeps({ key: { value: '' } });
    const op = callAI('system prompt', 'user prompt', deps);
    const result = await op.promise;
    expect(result).toBeNull();
  });

  it('AI Base URL 为空时直接返回 null', async () => {
    const deps = createDeps({ baseURL: { value: '' } });
    const op = callAI('system prompt', 'user prompt', deps);
    const result = await op.promise;
    expect(result).toBeNull();
  });

  // ---- P0 正常流程 ----

  it('正常返回 AI 响应文本', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'AI 回复内容' } }],
      }),
    });
    const deps = createDeps();
    const op = callAI('system', 'user', deps);
    const result = await op.promise;
    expect(result).toBe('AI 回复内容');
  });

  // ---- P0 边界情况 ----

  it('API 返回 401/403 时提示 Key 无效', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve(''),
    });
    const deps = createDeps();
    const op = callAI('system', 'user', deps);
    const result = await op.promise;
    expect(result).toBeNull();
    expect(deps.getToastMessages().some(t => t.msg.includes('Key 无效'))).toBe(true);
  });

  it('API 返回 429 时提示限流', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: () => Promise.resolve(''),
    });
    const deps = createDeps();
    const op = callAI('system', 'user', deps);
    const result = await op.promise;
    expect(result).toBeNull();
    expect(deps.getToastMessages().some(t => t.msg.includes('429'))).toBe(true);
  });

  it('API 返回 5xx 时提示服务不可用', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      text: () => Promise.resolve(''),
    });
    const deps = createDeps();
    const op = callAI('system', 'user', deps);
    const result = await op.promise;
    expect(result).toBeNull();
    expect(deps.getToastMessages().some(t => t.msg.includes('502'))).toBe(true);
  });

  it('网络错误时返回 null', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));
    const deps = createDeps();
    const op = callAI('system', 'user', deps);
    const result = await op.promise;
    expect(result).toBeNull();
  });

  // ---- P1 请求格式 ----

  it('请求 URL 格式正确（追加 /chat/completions）', async () => {
    let calledUrl = '';
    global.fetch = vi.fn().mockImplementation((url) => {
      calledUrl = url;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ choices: [{ message: { content: '' } }] }),
      });
    });
    const deps = createDeps();
    const op = callAI('system', 'user', deps);
    await op.promise;
    expect(calledUrl).toMatch(/\/chat\/completions$/);
  });

  // ---- P1 安全 ----

  it('错误响应体含 key 时 toast 不暴露敏感信息', async () => {
    // mock 500 错误，响应体包含类似 key 的字符串
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('{"error":{"message":"Invalid API key: sk-abc123..."}}'),
    });
    const deps = createDeps();
    const op = callAI('system', 'user', deps);
    const result = await op.promise;
    expect(result).toBeNull();
    // toast 中不应包含 "sk-" 等敏感模式
    const allToasts = deps.getToastMessages().map(t => t.msg).join(' ');
    expect(allToasts).not.toMatch(/sk-[a-zA-Z0-9]+/);
    expect(allToasts).toMatch(/暂不可用/);
  });

  // ---- P1 超时行为 ----

  it('30s 无响应应提示超时并返回 null', async () => {
    // mock fetch 永不 resolve，但监听 abort signal
    global.fetch = vi.fn().mockImplementation((url, options) => {
      return new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
      });
    });
    const deps = createDeps();
    const op = callAI('system', 'user', deps);
    // 推进 30s 触发超时
    await vi.advanceTimersByTimeAsync(30000);
    const result = await op.promise;
    expect(result).toBeNull();
    expect(deps.loading.value).toBe(false);
    // 回归：修复前 timedOut 按值捕获，超时后句柄上的字段恒为 false；
    // 现改为 getter，超时后读取应实时反映 true。
    expect(op.timedOut).toBe(true);
    expect(deps.getToastMessages().some(t => t.msg.includes('超时'))).toBe(true);
  });
});
