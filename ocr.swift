import Foundation
import Vision
import AppKit

let args = CommandLine.arguments
if args.count < 2 {
    print("Please provide an image path")
    exit(1)
}

let imagePath = args[1]
guard let image = NSImage(contentsOfFile: imagePath),
      let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    print("Could not load image")
    exit(1)
}

let requestHandler = VNImageRequestHandler(cgImage: cgImage, options: [:])
let request = VNRecognizeTextRequest { (request, error) in
    guard let observations = request.results as? [VNRecognizedTextObservation] else {
        print("No text found")
        return
    }
    
    var tokenLines: [String] = []
    for observation in observations {
        let text = observation.topCandidates(1).first?.string ?? ""
        if text.hasPrefix("AQVK") || text.hasPrefix("T60") || text.hasPrefix("PCc") || text.hasPrefix("Rk4") || text.hasPrefix("QW7") || text.contains("-yCx") || text.contains("vBiLZ") || text.contains("CkBewOT") {
            // These strings are characteristic of the token lines. Just to filter noise.
            tokenLines.append(text)
        }
        else if (text.count > 20 && !text.contains(" ") && !text.contains("access token") && !text.contains("Access token")) {
             tokenLines.append(text)
        }
    }
    
    // Attempt printing everything just in case
    for obs in observations {
        let r = obs.topCandidates(1).first?.string ?? ""
        if r.count > 30 && !r.contains(" ") {
            print("FOUND: \(r)")
        }
    }
}

request.recognitionLevel = .accurate
request.usesLanguageCorrection = false

try? requestHandler.perform([request])
