package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/ForgeNexa/forge-ide/services/forge-daemon/pkg/server"
)

func main() {
	// Send logs strictly to stderr so stdout is dedicated to JSON-RPC 2.0 streaming
	logger := log.New(os.Stderr, "[forge-daemon] ", log.LstdFlags|log.Lshortfile)
	logger.Println("Starting my-forge Go daemon v0.1.0...")

	srv := server.NewServer(logger)

	// Handle signals for graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		sig := <-sigChan
		logger.Printf("Received signal %v, initiating shutdown...", sig)
		os.Exit(0)
	}()

	if err := srv.Serve(os.Stdin, os.Stdout); err != nil {
		logger.Fatalf("Daemon serve error: %v", err)
	}

	logger.Println("Daemon stopped cleanly.")
}
