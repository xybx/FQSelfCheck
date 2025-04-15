import { basemapStore, viewStore, menuStore } from './modules/map';

const useStore = () => {
    return {
        mapStore: basemapStore(),
        viewStore: viewStore(),
        menuStore: menuStore(),
    };
};

export default useStore;
