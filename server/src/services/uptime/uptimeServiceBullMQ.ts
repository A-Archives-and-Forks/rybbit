import { MonitorSchedulerBullMQ } from "./monitorSchedulerBullMQ.js";
import { MonitorExecutorBullMQ } from "./monitorExecutorBullMQ.js";
import { RegionHealthChecker } from "./regionHealthChecker.js";

export class UptimeServiceBullMQ {
  private scheduler: MonitorSchedulerBullMQ;
  private executor: MonitorExecutorBullMQ;
  private regionHealthChecker: RegionHealthChecker;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.scheduler = new MonitorSchedulerBullMQ();
    this.executor = new MonitorExecutorBullMQ(10); // 10 concurrent workers
    this.regionHealthChecker = new RegionHealthChecker(60000); // Check every minute
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log("Uptime service already initialized");
      return;
    }

    // If already initializing, return the existing promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Create and store the initialization promise
    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log("Initializing BullMQ uptime monitoring service...");

      // Initialize scheduler (creates queue, loads and schedules all monitors)
      await this.scheduler.initialize();

      // Start executor (begins processing jobs)
      await this.executor.start();

      // Start region health checker
      await this.regionHealthChecker.start();

      this.initialized = true;
      console.log("BullMQ uptime monitoring service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize uptime service:", error);
      this.initializationPromise = null; // Reset on failure
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    console.log("Shutting down BullMQ uptime monitoring service...");

    try {
      // Stop region health checker
      await this.regionHealthChecker.stop();

      // Shutdown executor first (stops processing new jobs)
      await this.executor.shutdown();

      // Then shutdown scheduler (closes queue)
      await this.scheduler.shutdown();

      this.initialized = false;
      console.log("BullMQ uptime monitoring service shut down successfully");
    } catch (error) {
      console.error("Error during uptime service shutdown:", error);
    }
  }

  // Methods for managing monitors after CRUD operations
  async onMonitorCreated(monitorId: number, intervalSeconds: number): Promise<void> {
    // Wait for initialization if it's in progress
    console.log(`[Uptime] initialized: ${this.initialized} this.initializationPromise: ${this.initializationPromise}`);

    if (!this.initialized && this.initializationPromise) {
      await this.initializationPromise;
    }

    if (!this.initialized) {
      console.warn("Uptime service not initialized, cannot schedule monitor");
      return;
    }

    // Schedule the monitor for recurring checks
    await this.scheduler.scheduleMonitor(monitorId, intervalSeconds);

    // Trigger an immediate check
    await this.scheduler.triggerImmediateCheck(monitorId);
  }

  async onMonitorUpdated(monitorId: number, intervalSeconds: number, enabled: boolean): Promise<void> {
    // Wait for initialization if it's in progress
    if (!this.initialized && this.initializationPromise) {
      await this.initializationPromise;
    }

    if (!this.initialized) {
      console.warn("Uptime service not initialized, cannot update monitor");
      return;
    }

    if (enabled) {
      await this.scheduler.updateMonitorSchedule(monitorId, intervalSeconds);
      // Trigger immediate check when monitor is re-enabled
      await this.scheduler.triggerImmediateCheck(monitorId);
    } else {
      await this.scheduler.removeMonitorSchedule(monitorId);
    }
  }

  async onMonitorDeleted(monitorId: number): Promise<void> {
    // Wait for initialization if it's in progress
    if (!this.initialized && this.initializationPromise) {
      await this.initializationPromise;
    }

    if (!this.initialized) {
      console.warn("Uptime service not initialized, cannot delete monitor");
      return;
    }

    await this.scheduler.removeMonitorSchedule(monitorId);
  }
}

// Export singleton instance
export const uptimeServiceBullMQ = new UptimeServiceBullMQ();
