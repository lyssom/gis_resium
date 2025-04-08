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

    // interceptors(instance) {
    //     instance.interceptors.response.use(function (response) {
    //       // 对响应数据做点什么
    //       return response;
    //     }, function (error) {
    //       const status = error.response.status;


    //       if (status === 200) {
    //         // console.log(error, 'error')
    //         console.log(6666666);
    //         message.error('接口不存在');
    //       } 
    //       return Promise.reject(error);
    //     });
    // }

    interceptors(instance) {
      instance.interceptors.response.use(function (response) {
          // 对响应数据做点什么
          console.log(666666666)
          if (response.data === "Authorization required") {
            window.location.href = '/lic'; // 或者使用你框架的路由跳转方法
          }

          return response;
      }, function (error) {
          const status = error.response.status;
          const message = error.response.data
          console.log(message)
          console.log(666666666)
  
          // 判断响应码为200并且message为'Authorization required'
          if (status === 200 && message === 'Authorization required') {
              console.log('Unauthorized access, redirecting to login...');
              // 重定向到授权界面
              window.location.href = '/lic'; // 或者使用你框架的路由跳转方法
          } else {
              console.log('Unexpected error:', error);
          }
  
          return Promise.reject(error);
      });
  }
  

    request(options) {
        options = {...this.getInsideConfig(), ...options}
        const instance = axios.create()
        this.interceptors(instance)
        return instance(options)
    }
}

export default new HttpRequest(baseUrl)