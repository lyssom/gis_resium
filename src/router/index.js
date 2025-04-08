import { createBrowserRouter, Navigate } from 'react-router-dom'
// import Main from '../pages/CesiumViewer'
import Main from '../pages/main'
// import Home from '../pages/home'
// import Login from '../pages/login'
import Lic from '../pages/lic'
const routes = [
    {
        path: '/',
        Component: Main,
        // children: [
        //     {
        //         path: '/',
        //         element: <Navigate to="home" replace />
        //     },
        //     {
        //         path: 'home',
        //         Component: Home,
        //     },
        // ]
    },
    {
        path: '/lic',
        Component: Lic
    }
]
export default createBrowserRouter(routes)