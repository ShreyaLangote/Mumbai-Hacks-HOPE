export const saveDeviceToken = (token: string) => {
    localStorage.setItem("hope_device_token", token);
};

export const getDeviceToken = () => {
    return localStorage.getItem("hope_device_token");
};
