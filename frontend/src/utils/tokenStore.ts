export const tokenStore = (function () {
  let access: string | null = null
  return {
    getAccess() { return access },
    setAccess(t: string | null) { access = t }
  }
})()
