//
//  KeyTimeApp.swift
//  KeyTime
//
//  Created by Frédéric Gessler on 13.01.2025.
//

import SwiftUI

@main
struct KeyTimeApp: App {
    private enum ViewState {
        case loading(Error?)
        case ready(KeyStats)
    }
    
    @State private var state = ViewState.loading(nil)
    
    private let keyTracker = KeyTracker()
    private let stats = KeyStats()

    var body: some Scene {
        WindowGroup {
            Group {
                switch state {
                case .ready(let keyStats):
                    ContentView(keyStats: keyStats)
                        .onAppear {
                            print("tracking...")
                            Task {
                                keyTracker.track()
                                print("tracking setup")
                            }
                        }
                case .loading(let error):
                    Text("Error loading DB")
                        .task{ prepareKeyStats() }
                }
            }
        }
    }
    
    private func prepareKeyStats() {
        guard case .loading(_) = state else { return }
        self.state = .loading(nil)
        do {
            print("building key stats")
          self.state = .ready(try KeyStats())
        }
        catch {
          self.state = .loading(error)
        }
      }
}
