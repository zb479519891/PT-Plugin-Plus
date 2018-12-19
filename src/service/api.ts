import localStorage from "./localStorage";
import md5 from "blueimp-md5";

const API_RAW_URL =
  "https://raw.githubusercontent.com/ronggang/PT-Plugin-Plus/master/resource";
const API_URL =
  "https://api.github.com/repos/ronggang/PT-Plugin-Plus/contents/resource";

const TEST_API_URL = "http://localhost:8001";

// 调试信息
let developmentAPI = {
  host: TEST_API_URL,
  schemas: `${TEST_API_URL}/schema.json`,
  schemaConfig: `${TEST_API_URL}/schemas/{$schema}/config.json`,
  sites: `${TEST_API_URL}/sites.json`,
  siteConfig: `${TEST_API_URL}/sites/{$site}/config.json`,
  clients: `${TEST_API_URL}/clients.json`,
  clientConfig: `${TEST_API_URL}/clients/{$client}/config.json`
};

let productAPI = {
  host: API_RAW_URL,
  schemas: `${API_URL}/schemas`,
  schemaConfig: `${API_RAW_URL}/schemas/{$schema}/config.json`,
  sites: `${API_URL}/sites`,
  siteConfig: `${API_RAW_URL}/sites/{$site}/config.json`,
  clients: `${API_URL}/clients`,
  clientConfig: `${API_RAW_URL}/clients/{$client}/config.json`
};

if (process.env.NODE_ENV === "development") {
  productAPI = developmentAPI;
}

console.log("process.env.NODE_ENV", process.env.NODE_ENV);

export const APP = {
  cache: {
    localStorage: new localStorage(),
    cacheKey: "PT-Plugin-Plus-Cache-Contents",
    contents: {} as any,
    // 10 天
    expires: 60 * 60 * 24 * 10,
    init(callback?: any) {
      console.log("cache.init");
      this.localStorage.get(this.cacheKey, (result: any) => {
        if (result) {
          let expires = result["expires"];
          // 判断是否过期
          if (expires && new Date() > new Date(expires)) {
            this.contents = {};
          } else {
            this.contents = result;
          }
        }
        callback && callback();
      });
    },
    /**
     * 获取缓存
     * @param key
     */
    get(key: string): string | null {
      if (this.contents) {
        return this.contents[md5(key)];
      }
      return null;
    },
    /**
     * 设置缓存
     * @param key
     * @param content
     */
    set(key: string, content: string) {
      this.contents[md5(key)] = content;
      this.contents["expires"] = new Date().getTime() + this.expires;
      this.localStorage.set(this.cacheKey, this.contents);
    },
    /**
     * 清除缓存
     */
    clear() {
      this.contents = {};
      this.localStorage.set(this.cacheKey, this.contents);
    }
  },
  /**
   * 执行脚本
   * @param scriptPath
   */
  execScript(scriptPath: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let url = `${API.host}/${scriptPath}`;
      let content = this.cache.get(url);
      if (content) {
        eval(content);
        resolve();
      } else {
        $.get(
          url,
          result => {
            eval(result);
            this.cache.set(url, result);
            resolve();
          },
          "text"
        );
      }
    });
  },
  /**
   * 追加样式信息
   * @param stylePath
   */
  applyStyle(stylePath: string): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      let url = `${API.host}/${stylePath}`;
      let content = this.cache.get(url);
      let style = $("<style/>").appendTo(document.body);
      if (content) {
        style.html(content);
        resolve();
      } else {
        $.get(
          url,
          result => {
            style.html(result);
            this.cache.set(url, result);
            resolve();
          },
          "text"
        );
      }
      // var link = $("<link/>")
      //   .attr({
      //     rel: "stylesheet",
      //     type: "text/css",
      //     href: `${this.host}/${stylePath}?__t__=` + Math.random()
      //   })
      //   .appendTo($("head")[0]);

      // resolve();
    });
  }
};

APP.cache.init();

export const API = productAPI;
