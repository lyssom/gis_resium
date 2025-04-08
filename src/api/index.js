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

export const getlicinfo = () => {
    return axios.request({
        url: '/get_lic_info',
        method: 'get',
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

export const getExcavateResource = (params) => {
    return axios.request({
        url: '/get_excavate_resource',
        method: 'get',
        params
    })
}

export const getCzmlData = (url) => {
    return axios.request({
        url,
        method: 'get',
    })
}


export const deleteImageData = (data) => {
    return axios.request({
        url: '/delete_image_data',
        method: 'post',
        data
    })
}

// export const getwindData = () => {
//     return axios.request({
//         url: '/get_wind_data',
//         method: 'get',
//     })
// }