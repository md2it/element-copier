// ../lib/our/safe-extension-api.ts
function normalizeSafeExtensionApiIgnoredErrors(sources) {
  const sourceList = Array.isArray(sources) ? sources : [sources];
  const normalized = {};
  for (const source of sourceList) {
    if (!source) continue;
    for (const [method, rule] of Object.entries(source)) {
      if (!rule?.messages?.length) continue;
      const current = normalized[method];
      normalized[method] = {
        messages: current ? [...current.messages, ...rule.messages] : [...rule.messages],
        fallback: Object.prototype.hasOwnProperty.call(rule, "fallback") ? rule.fallback : current?.fallback,
      };
    }
  }
  return normalized;
}
function shouldIgnoreExtensionApiError(ignoredErrors, method, err) {
  const rule = ignoredErrors[method];
  if (!rule) return false;
  const message = String(err instanceof Error ? err.message : err?.message ?? err);
  return rule.messages.some((expected) => message.includes(expected));
}
function safeExtensionApiMethod(ignoredErrors, method, target, fn) {
  const rule = ignoredErrors[method];
  return function (...args) {
    try {
      const result = fn.apply(target, args);
      if (!result?.then) return result;
      return result.catch((err) => {
        if (shouldIgnoreExtensionApiError(ignoredErrors, method, err)) {
          return rule.fallback;
        }
        throw err;
      });
    } catch (err) {
      if (shouldIgnoreExtensionApiError(ignoredErrors, method, err)) {
        return rule.fallback;
      }
      throw err;
    }
  };
}
function createSafeExtensionApi(base, ignoredErrors) {
  const normalizedIgnoredErrors = normalizeSafeExtensionApiIgnoredErrors(ignoredErrors);
  const namespaceCache = new Map();
  return new Proxy(base, {
    get(target, namespace, receiver) {
      const value = Reflect.get(target, namespace, receiver);
      if (!value || typeof value !== "object") return value;
      if (namespaceCache.has(namespace)) return namespaceCache.get(namespace);
      const wrapped = new Proxy(value, {
        get(namespaceTarget, method, methodReceiver) {
          const methodValue = Reflect.get(namespaceTarget, method, methodReceiver);
          const methodKey = `${String(namespace)}.${String(method)}`;
          if (typeof methodValue === "function" && normalizedIgnoredErrors[methodKey]) {
            return safeExtensionApiMethod(
              normalizedIgnoredErrors,
              methodKey,
              namespaceTarget,
              methodValue,
            );
          }
          return methodValue;
        },
      });
      namespaceCache.set(namespace, wrapped);
      return wrapped;
    },
  });
}

export { createSafeExtensionApi };
