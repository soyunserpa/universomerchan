import Foundation
import Vision
import AppKit

let args = CommandLine.arguments
let imagePath = args[1]
guard let image = NSImage(contentsOfFile: imagePath),
      let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    exit(1)
}

let requestHandler = VNImageRequestHandler(cgImage: cgImage, options: [:])
let request = VNRecognizeTextRequest { (request, error) in
    guard let observations = request.results as? [VNRecognizedTextObservation] else {
        return
    }
    for obs in observations {
        let r = obs.topCandidates(1).first?.string ?? ""
        print(">> \(r)")
    }
}
request.recognitionLevel = .accurate
request.usesLanguageCorrection = false
try? requestHandler.perform([request])
