import axios from './axios'
// import axios from 'axios';


export const  get_space_distance = (data) => {
    console.log(999)
    return axios.request({
        url: '/getSpaceDistance',
        method: 'post',
        data: {'positions': data}
    })
}

export const getSceneDetail = (params) => {
    console.log(999)
    return axios.request({
        url: '/get_scene_detail',
        method: 'get',
        // data: {'positions': data}
        params
    })
}

export const saveSceneDetail = (data) => {
    return axios.request({
        url: '/save_scene_detail',
        method: 'post',
        // data: {'positions': data}
        data
    })
}

export const getSceneList = () => {
    return axios.request({
        url: '/get_scene_list',
        method: 'get',
    })
}

export const getImageDatas = () => {
    return axios.request({
        url: '/get_image_datas',
        method: 'get',
    })
}

export const saveImageData = (data) => {
    return axios.request({
        url: '/save_image_data',
        method: 'post',
        // data: {'positions': data}
        data
    })
}
