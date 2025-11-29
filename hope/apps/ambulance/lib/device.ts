export const saveDeviceToken = (token: string) => {
    document.cookie = `hope_device_token=${token}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Strict`;
};

export const getDeviceToken = () => {
    const name = "hope_device_token=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');

    for (let cookie of cookieArray) {
        cookie = cookie.trim();
        if (cookie.indexOf(name) === 0) {
            return cookie.substring(name.length);
        }
    }

    return null;
};

export const deleteDeviceToken = () => {
    document.cookie = "hope_device_token=; path=/; max-age=0";
};