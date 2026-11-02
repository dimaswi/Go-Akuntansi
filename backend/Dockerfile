# ==========================================
# Build Stage
# ==========================================
FROM golang:alpine AS builder

WORKDIR /app

ENV GOTOOLCHAIN=auto
ENV CGO_ENABLED=0
ENV GOOS=linux

RUN apk add --no-cache git ca-certificates tzdata

# Cache Go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy application source code
COPY . .

# Build statically linked binary
RUN go build -ldflags="-w -s" -o server ./cmd/server

# ==========================================
# Production Runtime Stage
# ==========================================
FROM alpine:3.20

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Jakarta

# Copy executable binary
COPY --from=builder /app/server .
COPY .env.example .env

EXPOSE 8080

CMD ["./server"]

