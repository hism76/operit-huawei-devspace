import toolboxUI from "./huawei_devspace_setup/index.ui.js";

export function registerToolPkg() {
    ToolPkg.registerToolboxUiModule({
        id: "huawei_devspace_setup",
        runtime: "compose_dsl",
        screen: toolboxUI,
        params: {},
        title: {
            zh: "华为云开发空间管理",
            en: "Huawei DevSpace Manager"
        }
    });
    return true;
}

export function onApplicationCreate() {
    return { ok: true };
}
