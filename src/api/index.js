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