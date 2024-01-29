export interface taskIdInfo {
    taskID: string
}

export interface ContainerInfo {
    id: string
    status: string
    name: string
    usingImage: string
    createImage: string
    createTime: string
    runningTime: string
    haveUpdate: boolean
}

export interface ImageInfo {
    id: string
    name: string
    tag: string
    size: string
    inUsed: boolean
    createTime: string
}

export interface VersionInfo {
    version: string
    buildTime: string
}

export interface RemoteVersionInfo {
    remoteVersion: string
}

export interface ProgressInfo {
    taskID: string
    name: string
    isDone: boolean
    message: string
    percentage: number
    detailMsg: string
}