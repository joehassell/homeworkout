import SwiftUI

struct ContentView: View {
    @EnvironmentObject var manager: WorkoutSessionManager

    var body: some View {
        if manager.isActive {
            ActiveWorkoutView()
        } else {
            IdleView()
        }
    }
}
