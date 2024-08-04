#include <ApplicationServices/ApplicationServices.h>
#include <Carbon/Carbon.h>

CFStringRef GetActiveWindowTitle() {
  // Get the accessibility element corresponding to the frontmost application
  AXUIElementRef appElem = AXUIElementCreateApplication(CGMainPID());
  if (!appElem) {
    return NULL;
  }

  // Get the accessibility element corresponding to the frontmost window
  AXUIElementRef window = NULL;
  AXError error = AXUIElementCopyAttributeValue(appElem, kAXFocusedWindowAttribute, (CFTypeRef*)&window);
  CFRelease(appElem);  // Release the app element as we don't need it anymore

  if (error != kAXErrorSuccess) {
    return NULL;
  }

  // Get the title of the frontmost window
  CFStringRef title = NULL;
  error = AXUIElementCopyAttributeValue(window, kAXTitleAttribute, (CFTypeRef*)&title);
  CFRelease(window);  // Release the window element

  if (error != kAXErrorSuccess) {
    return NULL;
  }

  return title;
}

// Function to get the application name (optional)
CFStringRef GetActiveWindowAppName() {
  AXUIElementRef appElem = AXUIElementCreateApplication(CGMainPID());
  if (!appElem) {
    return NULL;
  }

  // Get the application name
  CFStringRef appName = NULL;
  AXError error = AXUIElementCopyAttributeValue(appElem, kAXApplicationNameAttribute, (CFTypeRef*)&appName);
  CFRelease(appElem);

  if (error != kAXErrorSuccess) {
    return NULL;
  }

  return appName;
}

int main() {
  // Get the title of the active window
  CFStringRef title = GetActiveWindowTitle();
  if (title) {
    // Process the title (e.g., print it)
    printf("Active Window Title: %s\n", CFStringGetCString(title, kCFStringEncodingUTF8));
    CFRelease(title);
  } else {
    printf("Failed to get active window title\n");
  }

  // Optionally get the application name
  CFStringRef appName = GetActiveWindowAppName();
  if (appName) {
    printf("Active Window Application: %s\n", CFStringGetCString(appName, kCFStringEncodingUTF8));
    CFRelease(appName);
  } else {
    printf("Failed to get active window application name\n");
  }

  return 0;
}