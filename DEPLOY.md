# Guia de Deploy - HVAC Monitor

Este guia explica como fazer o deploy da aplicacao para producao em um servidor proprio ou em plataformas de hospedagem.

## Pré-requisitos

- Node.js (versao 18 ou superior)
- npm ou yarn
- Acesso a um servidor ou plataforma de hospedagem

## 1. Build da Aplicacao

Primeiro, vamos gerar a versao otimizada para producao:

```bash
npm run build
```

Isso ira criar uma pasta `dist/` com todos os arquivos otimizados.

## 2. Opcoes de Hospedagem

### Opcao 1: Vercel (Recomendado para Simplicidade)

1. Instale o Vercel CLI:
```bash
npm install -g vercel
```

2. Faça login:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

### Opcao 2: Netlify

1. Instale o Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Faça login:
```bash
netlify login
```

3. Deploy:
```bash
netlify deploy --prod --dir=dist
```

### Opcao 3: Servidor Proprio (Nginx)

1. Copie o conteudo da pasta `dist/` para o servidor
2. Configure o Nginx:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    root /var/www/hvac-monitor/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

3. Reinicie o Nginx:
```bash
sudo systemctl restart nginx
```

### Opcao 4: Docker

Crie um arquivo `Dockerfile`:

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Crie um arquivo `nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Build e execute:
```bash
docker build -t hvac-monitor .
docker run -p 80:80 hvac-monitor
```

## 3. Configuracao de Dominio

1. Compre um dominio (ex: GoDaddy, Namecheap, Registro.br)
2. Configure os DNS para apontar para o seu servidor
3. Configure SSL/TLS (Lets Encrypt recomendado)

## 4. Dados do Cliente

Para inserir dados manualmente para o cliente:

1. Edite os arquivos CSV na pasta `data/`
2. Execute o script para converter para mock data:
```bash
python scripts/csv-to-mock-data.py
```
3. Refaça o build e deploy

## 5. Monitoramento

- Verifique os logs do servidor
- Configure monitoramento de uptime (ex: UptimeRobot)
- Configure Google Analytics

## Troubleshooting

- **Erro 404 nas rotas**: Certifique-se de que o servidor esta configurado para redirecionar todas as rotas para `index.html`
- **Arquivos nao carregando**: Verifique as configuracoes de CORS e caminhos relativos
- **Performance**: Habilite CDN e cache de arquivos estaticos
