export default {
  beforeCreate(event) {
    const { data } = event.params
    if (data.slug) {
      data.fullPath = data.slug.startsWith("/") ? data.slug : `/${data.slug}`
    }
  },
  beforeUpdate(event) {
    const { data } = event.params
    if (data.slug) {
      data.fullPath = data.slug.startsWith("/") ? data.slug : `/${data.slug}`
    }
  },
}
