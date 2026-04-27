import SwiftUI

@main
struct HomeWorkoutWatchApp: App {
    @StateObject private var manager = WorkoutSessionManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(manager)
        }
    }
}
