import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

// ElementPlus
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import '@/assets/styles/global.scss';

// iconfont
import '@/assets/iconfonts/iconfont.css';
import '@/assets/iconfonts/iconfont';

// Element Icon
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

const app = createApp(App);

/* Element 相关 */
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}
app.use(ElementPlus, {
    locale: zhCn,
});

app.use(createPinia());
app.use(router);

app.mount('#app');
