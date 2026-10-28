package api

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/yantra-works/my-forge/services/forge-daemon/pkg/ai"
	"github.com/yantra-works/my-forge/services/forge-daemon/pkg/git"
	"github.com/yantra-works/my-forge/services/forge-daemon/pkg/lsp"
	"github.com/yantra-works/my-forge/services/forge-daemon/pkg/settings"
	"github.com/yantra-works/my-forge/services/forge-daemon/pkg/tasks"
	"github.com/yantra-works/my-forge/services/forge-daemon/pkg/workspace"
)

// ServerDependencies groups service references needed by the HTTP API.
type ServerDependencies struct {
	Indexer  *workspace.Indexer
	Git      *git.Manager
	Lsp      *lsp.Manager
	Tasks    *tasks.Manager
	Settings *settings.Manager
	AI       *ai.Provider
}

// Router wraps the Gin engine with security controls.
type Router struct {
	engine    *gin.Engine
	authToken string
	deps      ServerDependencies
}

// NewRouter constructs a Gin HTTP router with authentication and security middleware.
func NewRouter(deps ServerDependencies, authToken string) *Router {
	gin.SetMode(gin.ReleaseMode)
	engine := gin.New()

	if authToken == "" {
		tokenBytes := make([]byte, 16)
		_, _ = rand.Read(tokenBytes)
		authToken = hex.EncodeToString(tokenBytes)
	}

	r := &Router{
		engine:    engine,
		authToken: authToken,
		deps:      deps,
	}

	r.setupMiddleware()
	r.setupRoutes()
	return r
}

// GetToken returns the active session bearer token.
func (r *Router) GetToken() string {
	return r.authToken
}

// Engine returns the underlying Gin engine.
func (r *Router) Engine() *gin.Engine {
	return r.engine
}

func (r *Router) setupMiddleware() {
	// Recovery middleware
	r.engine.Use(gin.Recovery())

	// Security & Auth middleware
	r.engine.Use(func(c *gin.Context) {
		// Public health endpoint
		if c.Request.URL.Path == "/api/v1/health" {
			c.Next()
			return
		}

		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "Missing or malformed Authorization header. Expected 'Bearer <token>'",
			})
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token != r.authToken {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "Invalid authentication token",
			})
			return
		}

		c.Next()
	})
}

func (r *Router) setupRoutes() {
	v1 := r.engine.Group("/api/v1")
	{
		// Health & System
		v1.GET("/health", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status":    "healthy",
				"server":    "forge-daemon-http",
				"version":   "0.2.0",
				"timestamp": time.Now().UTC().Format(time.RFC3339),
			})
		})

		// Workspace file tree
		v1.GET("/workspace/tree", func(c *gin.Context) {
			if r.deps.Indexer == nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Indexer not initialized"})
				return
			}
			entries, err := r.deps.Indexer.ListDirectory("")
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"files": entries})
		})

		// Workspace file reader
		v1.GET("/workspace/file", func(c *gin.Context) {
			relPath := c.Query("path")
			if relPath == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "'path' query parameter required"})
				return
			}
			if r.deps.Indexer == nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Indexer not initialized"})
				return
			}
			content, err := r.deps.Indexer.ReadFile(relPath)
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"path": relPath, "content": content})
		})

		// Git status
		v1.GET("/git/status", func(c *gin.Context) {
			if r.deps.Git == nil || r.deps.Indexer == nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Git manager not initialized"})
				return
			}
			root := r.deps.Indexer.GetWorkspaceRoot()
			status, err := r.deps.Git.GetStatus(root)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, status)
		})

		// Tasks
		v1.GET("/tasks", func(c *gin.Context) {
			if r.deps.Tasks == nil || r.deps.Indexer == nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Tasks manager not initialized"})
				return
			}
			root := r.deps.Indexer.GetWorkspaceRoot()
			detected, err := r.deps.Tasks.DetectTasks(root)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"tasks": detected})
		})

		// Settings
		v1.GET("/settings", func(c *gin.Context) {
			if r.deps.Settings == nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Settings manager not initialized"})
				return
			}
			c.JSON(http.StatusOK, r.deps.Settings.Get())
		})

		// AI completion
		v1.POST("/ai/completion", func(c *gin.Context) {
			if r.deps.AI == nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "AI provider not initialized"})
				return
			}
			var req ai.AICompletionRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			resp, err := r.deps.AI.Complete(c.Request.Context(), req)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, resp)
		})
	}
}
