import axios from "axios"
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
const baseUrl = "http://127.0.0.1:8000/"


class HttpRequest {
    constructor(baseUrl) {
        this.baseUrl = baseUrl
        this.headers = {}

    }
    getAuth() {
      if (localStorage.getItem("token") != null) {
        this.headers = {
          "Authorization": localStorage.getItem("token")
      }
    }}
    
    getInsideConfig() {
      this.getAuth()
        const config = {
            baseURL: this.baseUrl,
            headers: this.headers
            // withCredentials: true,
            // headers: {
            //   "Access-Control-Allow-Origin": "*",
            //   "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            //   "Access-Control-Allow-Headers": "Content-Type, Authorization",
            // }
        }
        return config
    }

    interceptors(instance) {
        // 添加请求拦截器
        instance.interceptors.request.use(function (config) {
          // 在发送请求之前做些什么
          return config;
        }, function (error) {
          // 对请求错误做些什么
          return Promise.reject(error);
        });
    
        // 添加响应拦截器
        instance.interceptors.response.use(function (response) {
          // 对响应数据做点什么
          return response;
        }, function (error) {
          const status = error.response.status;


          if (status === 404) {
            // console.log(error, 'error')
            message.error('接口不存在');
          } else if (status === 403 || status === 401) {
            // 403: 无权限，跳转到登录页
            message.error('无权限，请重新登录');
            // 清除本地的token并跳转到登录页
            localStorage.removeItem('token');
            // this.navigate('/login');
            window.location.href = '/login';
          } else {
            // 其他错误
            message.error(error.response?.data?.msg || '服务器错误');
          }
          console.log(error, 'error')
          // 对响应错误做点什么
          return Promise.reject(error);
        });
    }

    request(options) {
        options = {...this.getInsideConfig(), ...options}
        const instance = axios.create()
        // this.interceptors(instance)
        return instance(options)
    }
}

export default new HttpRequest(baseUrl)