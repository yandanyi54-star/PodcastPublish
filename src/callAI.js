// ========== 净排 · AI 写作助手（用户自带 Key，纯前端直连）==========

/**
 * 调用 AI（OpenAI 兼容格式）
 * 同步返回 { promise, cancel, timedOut }，调用方可通过 cancel() 中断请求
 *
 * @param {string} systemPrompt - 系统提示词
 * @param {string} userPrompt - 用户输入内容
 * @param {object} deps - 依赖注入 { key, baseURL, model, loading, showToast }
 *   - key: ref<string> API Key
 *   - baseURL: ref<string> API Base URL
 *   - model: ref<string> 模型名
 *   - loading: ref<boolean> 加载状态
 *   - showToast: (msg, type) => void
 * @returns {{ promise: Promise<string|null>, cancel: ()=>void, timedOut: boolean }}
 */
export const callAI = (systemPrompt, userPrompt, deps) => {
  const { key, baseURL, model, loading, showToast } = deps;
  if (!key.value) {
    showToast('请先在 AI 设置里填你的 API Key', 'error');
    return { promise: Promise.resolve(null), cancel: () => {}, timedOut: false };
  }
  if (!baseURL.value) {
    showToast('请填写接口 Base URL（或选个预设）', 'error');
    return { promise: Promise.resolve(null), cancel: () => {}, timedOut: false };
  }
  loading.value = true;
  const ctrl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; ctrl.abort(); }, 30000);  // 30s 超时保护

  const promise = (async () => {
    try {
      const resp = await fetch(baseURL.value.replace(/\/$/, '') + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + key.value
        },
        body: JSON.stringify({
          model: model.value,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7
        }),
        signal: ctrl.signal
      });
      if (!resp.ok) {
        const detail = await resp.text().catch(() => '');
        console.error('AI 接口错误', resp.status, detail);
        // 状态码细分，给可自助的恢复指引
        if (resp.status === 401 || resp.status === 403) {
          showToast('API Key 无效或无权限，请到设置页检查', 'error');
        } else if (resp.status === 429) {
          showToast('请求过于频繁（429），请稍候再试', 'error');
        } else if (resp.status >= 500) {
          showToast('服务暂不可用（' + resp.status + '），请稍后重试', 'error');
        } else {
          showToast('接口返回 ' + resp.status + '，可能是 Key 无效或厂商禁止浏览器跨域', 'error');
        }
        return null;
      }
      const data = await resp.json();
      return ((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '').trim();
    } catch (e) {
      if (e && e.name === 'AbortError') {
        showToast(timedOut ? '请求超时（30s），请稍后重试' : '已取消', timedOut ? 'error' : 'success');
        return null;
      }
      console.error(e);
      showToast('调用失败：' + (e && e.message ? e.message : e) + '。若提示 CORS，请换 OpenRouter 预设或自建代理', 'error');
      return null;
    } finally {
      clearTimeout(timer);
      loading.value = false;
    }
  })();  // 立即开始执行

  // 同步返回操控句柄：{ promise, cancel, timedOut }
  // timedOut 用 getter 暴露，保证超时后读取的是实时状态（而非调用时的快照 false）。
  // 旧写法 `timedOut,` 按值捕获，定时器改写的是闭包内局部变量，句柄上的字段永远是 false。
  return {
    promise,
    cancel: () => ctrl.abort(),
    get timedOut() { return timedOut; },
  };
};
