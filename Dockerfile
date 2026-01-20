# 使用Node.js官方镜像作为基础镜像
FROM node:22-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json（如果存在）
COPY package*.json ./

# 安装所有依赖（包括devDependencies，用于构建）
RUN npm install

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 使用nginx作为生产环境的web服务器
FROM nginx:alpine

# 复制自定义nginx配置（如果有的话）
# COPY nginx.conf /etc/nginx/nginx.conf

# 复制构建好的应用到nginx的html目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
