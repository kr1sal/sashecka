
// Windows temporarily needs this file, https://github.com/module-federation/vite/issues/68

    import {loadShare} from "@module-federation/runtime";
    const importMap = {
      
        "@mantine/core": async () => {
          let pkg = await import("__mf__virtual/__mfe_internal__authRemote__prebuild___mf_0_mantine_mf_1_core__prebuild__.js");
            return pkg;
        }
      ,
        "@mantine/hooks": async () => {
          let pkg = await import("__mf__virtual/__mfe_internal__authRemote__prebuild___mf_0_mantine_mf_1_hooks__prebuild__.js");
            return pkg;
        }
      ,
        "react": async () => {
          let pkg = await import("__mf__virtual/__mfe_internal__authRemote__prebuild__react__prebuild__.js");
            return pkg;
        }
      ,
        "react-dom": async () => {
          let pkg = await import("__mf__virtual/__mfe_internal__authRemote__prebuild__react_mf_2_dom__prebuild__.js");
            return pkg;
        }
      ,
        "react-router-dom": async () => {
          let pkg = await import("__mf__virtual/__mfe_internal__authRemote__prebuild__react_mf_2_router_mf_2_dom__prebuild__.js");
            return pkg;
        }
      
    }
      const usedShared = {
      
          "@mantine/core": {
            name: "@mantine/core",
            version: "9.0.2",
            scope: ["default"],
            loaded: false,
            from: "__mfe_internal__authRemote",
            async get () {
              if (false) {
                throw new Error(`[Module Federation] Shared module '${"@mantine/core"}' must be provided by host`);
              }
              usedShared["@mantine/core"].loaded = true
              const {"@mantine/core": pkgDynamicImport} = importMap
              const res = await pkgDynamicImport()
              const exportModule = false && "@mantine/core" === "react"
                ? (res?.default ?? res)
                : {...res}
              // All npm packages pre-built by vite will be converted to esm
              Object.defineProperty(exportModule, "__esModule", {
                value: true,
                enumerable: false
              })
              return function () {
                return exportModule
              }
            },
            shareConfig: {
              singleton: true,
              requiredVersion: "^9.0.2",
              
            }
          }
        ,
          "@mantine/hooks": {
            name: "@mantine/hooks",
            version: "9.0.2",
            scope: ["default"],
            loaded: false,
            from: "__mfe_internal__authRemote",
            async get () {
              if (false) {
                throw new Error(`[Module Federation] Shared module '${"@mantine/hooks"}' must be provided by host`);
              }
              usedShared["@mantine/hooks"].loaded = true
              const {"@mantine/hooks": pkgDynamicImport} = importMap
              const res = await pkgDynamicImport()
              const exportModule = false && "@mantine/hooks" === "react"
                ? (res?.default ?? res)
                : {...res}
              // All npm packages pre-built by vite will be converted to esm
              Object.defineProperty(exportModule, "__esModule", {
                value: true,
                enumerable: false
              })
              return function () {
                return exportModule
              }
            },
            shareConfig: {
              singleton: true,
              requiredVersion: "^9.0.2",
              
            }
          }
        ,
          "react": {
            name: "react",
            version: "19.2.5",
            scope: ["default"],
            loaded: false,
            from: "__mfe_internal__authRemote",
            async get () {
              if (false) {
                throw new Error(`[Module Federation] Shared module '${"react"}' must be provided by host`);
              }
              usedShared["react"].loaded = true
              const {"react": pkgDynamicImport} = importMap
              const res = await pkgDynamicImport()
              const exportModule = false && "react" === "react"
                ? (res?.default ?? res)
                : {...res}
              // All npm packages pre-built by vite will be converted to esm
              Object.defineProperty(exportModule, "__esModule", {
                value: true,
                enumerable: false
              })
              return function () {
                return exportModule
              }
            },
            shareConfig: {
              singleton: true,
              requiredVersion: "^19.2.5",
              
            }
          }
        ,
          "react-dom": {
            name: "react-dom",
            version: "19.2.5",
            scope: ["default"],
            loaded: false,
            from: "__mfe_internal__authRemote",
            async get () {
              if (false) {
                throw new Error(`[Module Federation] Shared module '${"react-dom"}' must be provided by host`);
              }
              usedShared["react-dom"].loaded = true
              const {"react-dom": pkgDynamicImport} = importMap
              const res = await pkgDynamicImport()
              const exportModule = false && "react-dom" === "react"
                ? (res?.default ?? res)
                : {...res}
              // All npm packages pre-built by vite will be converted to esm
              Object.defineProperty(exportModule, "__esModule", {
                value: true,
                enumerable: false
              })
              return function () {
                return exportModule
              }
            },
            shareConfig: {
              singleton: true,
              requiredVersion: "^19.2.5",
              
            }
          }
        ,
          "react-router-dom": {
            name: "react-router-dom",
            version: "7.14.1",
            scope: ["default"],
            loaded: false,
            from: "__mfe_internal__authRemote",
            async get () {
              if (false) {
                throw new Error(`[Module Federation] Shared module '${"react-router-dom"}' must be provided by host`);
              }
              usedShared["react-router-dom"].loaded = true
              const {"react-router-dom": pkgDynamicImport} = importMap
              const res = await pkgDynamicImport()
              const exportModule = false && "react-router-dom" === "react"
                ? (res?.default ?? res)
                : {...res}
              // All npm packages pre-built by vite will be converted to esm
              Object.defineProperty(exportModule, "__esModule", {
                value: true,
                enumerable: false
              })
              return function () {
                return exportModule
              }
            },
            shareConfig: {
              singleton: true,
              requiredVersion: "^7.14.1",
              
            }
          }
        
    }
      const usedRemotes = [
      ]
      export {
        usedShared,
        usedRemotes
      }
      