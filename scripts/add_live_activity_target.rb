#!/usr/bin/env ruby
# Adds the SimpleWorkoutGenLiveActivity widget extension target to the Xcode project.
# Run from the repo root: ruby scripts/add_live_activity_target.rb

require 'fileutils'

PBXPROJ = File.join(__dir__, '..', 'ios', 'App', 'App.xcodeproj', 'project.pbxproj')

content = File.read(PBXPROJ)

# Abort if target already exists
if content.include?('SimpleWorkoutGenLiveActivity')
  puts "Target SimpleWorkoutGenLiveActivity already exists in pbxproj — skipping."
  exit 0
end

# ── IDs (deterministic, prefixed LA1 to avoid collisions) ──

# File references
LA_SWIFT_REF        = 'LA10000010000000000000001' # SimpleWorkoutGenLiveActivity.swift
LA_BUNDLE_REF       = 'LA10000010000000000000002' # SimpleWorkoutGenLiveActivityBundle.swift
LA_INFO_REF         = 'LA10000010000000000000003' # Info.plist
LA_ACTKIT_REF       = 'LA10000010000000000000004' # ActivityKit.framework
LA_PRODUCT_REF      = 'LA10000010000000000000005' # SimpleWorkoutGenLiveActivity.appex

# Build files (Sources)
LA_SWIFT_BUILD      = 'LA10000020000000000000001'
LA_BUNDLE_BUILD     = 'LA10000020000000000000002'
# Build files (Frameworks)
LA_ACTKIT_BUILD     = 'LA10000020000000000000003'

# Group
LA_GROUP            = 'LA10000030000000000000001'

# Build phases
LA_SOURCES_PHASE    = 'LA10000040000000000000001'
LA_FRAMEWORKS_PHASE = 'LA10000040000000000000002'
LA_RESOURCES_PHASE  = 'LA10000040000000000000003'

# Native target
LA_TARGET           = 'LA10000050000000000000001'

# Build configurations
LA_DEBUG_CONFIG     = 'LA10000060000000000000001'
LA_RELEASE_CONFIG   = 'LA10000060000000000000002'

# Configuration list
LA_CONFIG_LIST      = 'LA10000070000000000000001'

# Container item proxy + dependency
LA_PROXY            = 'LA10000080000000000000001'
LA_DEPENDENCY       = 'LA10000080000000000000002'

# ── 1. PBXBuildFile entries ──
build_files = <<~PBXBUILD
\t\t#{LA_SWIFT_BUILD} /* SimpleWorkoutGenLiveActivity.swift in Sources */ = {isa = PBXBuildFile; fileRef = #{LA_SWIFT_REF} /* SimpleWorkoutGenLiveActivity.swift */; };
\t\t#{LA_BUNDLE_BUILD} /* SimpleWorkoutGenLiveActivityBundle.swift in Sources */ = {isa = PBXBuildFile; fileRef = #{LA_BUNDLE_REF} /* SimpleWorkoutGenLiveActivityBundle.swift */; };
\t\t#{LA_ACTKIT_BUILD} /* ActivityKit.framework in Frameworks */ = {isa = PBXBuildFile; fileRef = #{LA_ACTKIT_REF} /* ActivityKit.framework */; };
PBXBUILD

content.sub!("/* End PBXBuildFile section */", "#{build_files}/* End PBXBuildFile section */")

# ── 2. PBXFileReference entries ──
file_refs = <<~PBXREF
\t\t#{LA_SWIFT_REF} /* SimpleWorkoutGenLiveActivity.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = SimpleWorkoutGenLiveActivity.swift; sourceTree = "<group>"; };
\t\t#{LA_BUNDLE_REF} /* SimpleWorkoutGenLiveActivityBundle.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = SimpleWorkoutGenLiveActivityBundle.swift; sourceTree = "<group>"; };
\t\t#{LA_INFO_REF} /* Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>"; };
\t\t#{LA_ACTKIT_REF} /* ActivityKit.framework */ = {isa = PBXFileReference; lastKnownFileType = wrapper.framework; name = ActivityKit.framework; path = System/Library/Frameworks/ActivityKit.framework; sourceTree = SDKROOT; };
\t\t#{LA_PRODUCT_REF} /* SimpleWorkoutGenLiveActivity.appex */ = {isa = PBXFileReference; explicitFileType = "wrapper.app-extension"; includeInIndex = 0; path = SimpleWorkoutGenLiveActivity.appex; sourceTree = BUILT_PRODUCTS_DIR; };
PBXREF

content.sub!("/* End PBXFileReference section */", "#{file_refs}/* End PBXFileReference section */")

# ── 3. PBXContainerItemProxy + PBXTargetDependency ──
proxy_section = <<~PBXPROXY
/* Begin PBXContainerItemProxy section */
\t\t#{LA_PROXY} /* PBXContainerItemProxy */ = {
\t\t\tisa = PBXContainerItemProxy;
\t\t\tcontainerPortal = 504EC2FC1FED79650016851F /* Project object */;
\t\t\tproxyType = 1;
\t\t\tremoteGlobalIDString = #{LA_TARGET};
\t\t\tremoteInfo = SimpleWorkoutGenLiveActivity;
\t\t};
/* End PBXContainerItemProxy section */

/* Begin PBXTargetDependency section */
\t\t#{LA_DEPENDENCY} /* PBXTargetDependency */ = {
\t\t\tisa = PBXTargetDependency;
\t\t\ttarget = #{LA_TARGET} /* SimpleWorkoutGenLiveActivity */;
\t\t\ttargetProxy = #{LA_PROXY} /* PBXContainerItemProxy */;
\t\t};
/* End PBXTargetDependency section */

PBXPROXY

# Insert before PBXFrameworksBuildPhase
content.sub!("/* Begin PBXFrameworksBuildPhase section */", "#{proxy_section}/* Begin PBXFrameworksBuildPhase section */")

# ── 4. PBXFrameworksBuildPhase ──
fw_phase = <<~PBXFW
\t\t#{LA_FRAMEWORKS_PHASE} /* Frameworks */ = {
\t\t\tisa = PBXFrameworksBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t\t#{LA_ACTKIT_BUILD} /* ActivityKit.framework in Frameworks */,
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t};
PBXFW

content.sub!("/* End PBXFrameworksBuildPhase section */", "#{fw_phase}/* End PBXFrameworksBuildPhase section */")

# ── 5. PBXGroup — add extension group ──
la_group = <<~PBXGRP
\t\t#{LA_GROUP} /* SimpleWorkoutGenLiveActivity */ = {
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
\t\t\t\t#{LA_SWIFT_REF} /* SimpleWorkoutGenLiveActivity.swift */,
\t\t\t\t#{LA_BUNDLE_REF} /* SimpleWorkoutGenLiveActivityBundle.swift */,
\t\t\t\t#{LA_INFO_REF} /* Info.plist */,
\t\t\t);
\t\t\tpath = SimpleWorkoutGenLiveActivity;
\t\t\tsourceTree = "<group>";
\t\t};
PBXGRP

content.sub!("/* End PBXGroup section */", "#{la_group}/* End PBXGroup section */")

# Add to main group children (after HomeWorkoutWatch)
content.sub!(
  "W10A00003000000000000001 /* HomeWorkoutWatch */,\n\t\t\t\t504EC3051FED79650016851F /* Products */,",
  "W10A00003000000000000001 /* HomeWorkoutWatch */,\n\t\t\t\t#{LA_GROUP} /* SimpleWorkoutGenLiveActivity */,\n\t\t\t\t504EC3051FED79650016851F /* Products */,"
)

# Add product to Products group
content.sub!(
  "W10A0000100000000000000D /* HomeWorkoutWatch.app */,\n\t\t\t);\n\t\t\tname = Products;",
  "W10A0000100000000000000D /* HomeWorkoutWatch.app */,\n\t\t\t\t#{LA_PRODUCT_REF} /* SimpleWorkoutGenLiveActivity.appex */,\n\t\t\t);\n\t\t\tname = Products;"
)

# Add ActivityKit.framework to Frameworks group
content.sub!(
  "D539E9C49DCE02AD3F173676 /* ActivityKit.framework */,\n\t\t\t\tE3C7A6A16AB446B71C702EFF /* HealthKit.framework */,\n\t\t\t);\n\t\t\tname = Frameworks;",
  "D539E9C49DCE02AD3F173676 /* ActivityKit.framework */,\n\t\t\t\t#{LA_ACTKIT_REF} /* ActivityKit.framework */,\n\t\t\t\tE3C7A6A16AB446B71C702EFF /* HealthKit.framework */,\n\t\t\t);\n\t\t\tname = Frameworks;"
)

# ── 6. PBXNativeTarget ──
la_target = <<~PBXTARGET
\t\t#{LA_TARGET} /* SimpleWorkoutGenLiveActivity */ = {
\t\t\tisa = PBXNativeTarget;
\t\t\tbuildConfigurationList = #{LA_CONFIG_LIST} /* Build configuration list for PBXNativeTarget "SimpleWorkoutGenLiveActivity" */;
\t\t\tbuildPhases = (
\t\t\t\t#{LA_SOURCES_PHASE} /* Sources */,
\t\t\t\t#{LA_FRAMEWORKS_PHASE} /* Frameworks */,
\t\t\t\t#{LA_RESOURCES_PHASE} /* Resources */,
\t\t\t);
\t\t\tbuildRules = (
\t\t\t);
\t\t\tdependencies = (
\t\t\t);
\t\t\tname = SimpleWorkoutGenLiveActivity;
\t\t\tproductName = SimpleWorkoutGenLiveActivity;
\t\t\tproductReference = #{LA_PRODUCT_REF} /* SimpleWorkoutGenLiveActivity.appex */;
\t\t\tproductType = "com.apple.product-type.app-extension";
\t\t};
PBXTARGET

content.sub!("/* End PBXNativeTarget section */", "#{la_target}/* End PBXNativeTarget section */")

# Add dependency to App target
content.sub!(
  "504EC3031FED79650016851F /* App */ = {\n\t\t\tisa = PBXNativeTarget;\n\t\t\tbuildConfigurationList = 504EC3161FED79650016851F /* Build configuration list for PBXNativeTarget \"App\" */;\n\t\t\tbuildPhases = (\n\t\t\t\t504EC3001FED79650016851F /* Sources */,\n\t\t\t\t504EC3011FED79650016851F /* Frameworks */,\n\t\t\t\t504EC3021FED79650016851F /* Resources */,\n\t\t\t);\n\t\t\tbuildRules = (\n\t\t\t);\n\t\t\tdependencies = (\n\t\t\t);",
  "504EC3031FED79650016851F /* App */ = {\n\t\t\tisa = PBXNativeTarget;\n\t\t\tbuildConfigurationList = 504EC3161FED79650016851F /* Build configuration list for PBXNativeTarget \"App\" */;\n\t\t\tbuildPhases = (\n\t\t\t\t504EC3001FED79650016851F /* Sources */,\n\t\t\t\t504EC3011FED79650016851F /* Frameworks */,\n\t\t\t\t504EC3021FED79650016851F /* Resources */,\n\t\t\t);\n\t\t\tbuildRules = (\n\t\t\t);\n\t\t\tdependencies = (\n\t\t\t\t#{LA_DEPENDENCY} /* PBXTargetDependency */,\n\t\t\t);"
)

# ── 7. PBXProject — add target + target attributes ──
# Add to project targets list (matches actual indentation with 4-tab prefix)
content.sub!(
  "W10A00005000000000000001 /* HomeWorkoutWatch */,\n\t\t\t);\n\t\t};\n/* End PBXProject section */",
  "W10A00005000000000000001 /* HomeWorkoutWatch */,\n\t\t\t\t#{LA_TARGET} /* SimpleWorkoutGenLiveActivity */,\n\t\t\t);\n\t\t};\n/* End PBXProject section */"
)

content.sub!(
  "W10A00005000000000000001 = {\n\t\t\t\t\t\tCreatedOnToolsVersion = 15.0;\n\t\t\t\t\t\tProvisioningStyle = Automatic;\n\t\t\t\t\t};",
  "W10A00005000000000000001 = {\n\t\t\t\t\t\tCreatedOnToolsVersion = 15.0;\n\t\t\t\t\t\tProvisioningStyle = Automatic;\n\t\t\t\t\t};\n\t\t\t\t\t#{LA_TARGET} = {\n\t\t\t\t\t\tCreatedOnToolsVersion = 15.0;\n\t\t\t\t\t\tProvisioningStyle = Automatic;\n\t\t\t\t\t};"
)

# ── 8. PBXResourcesBuildPhase (empty — no resources for this extension) ──
res_phase = <<~PBXRES
\t\t#{LA_RESOURCES_PHASE} /* Resources */ = {
\t\t\tisa = PBXResourcesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t};
PBXRES

content.sub!("/* End PBXResourcesBuildPhase section */", "#{res_phase}/* End PBXResourcesBuildPhase section */")

# ── 9. PBXSourcesBuildPhase ──
sources_phase = <<~PBXSRC
\t\t#{LA_SOURCES_PHASE} /* Sources */ = {
\t\t\tisa = PBXSourcesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t\t#{LA_SWIFT_BUILD} /* SimpleWorkoutGenLiveActivity.swift in Sources */,
\t\t\t\t#{LA_BUNDLE_BUILD} /* SimpleWorkoutGenLiveActivityBundle.swift in Sources */,
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t};
PBXSRC

content.sub!("/* End PBXSourcesBuildPhase section */", "#{sources_phase}/* End PBXSourcesBuildPhase section */")

# ── 10. XCBuildConfiguration ──
la_configs = <<~PBXCFG
\t\t#{LA_DEBUG_CONFIG} /* Debug */ = {
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {
\t\t\t\tCODE_SIGN_STYLE = Automatic;
\t\t\t\tCURRENT_PROJECT_VERSION = 2;
\t\t\t\tDEVELOPMENT_TEAM = T33B88TGA8;
\t\t\t\tGENERATE_INFOPLIST_FILE = NO;
\t\t\t\tINFOPLIST_FILE = SimpleWorkoutGenLiveActivity/Info.plist;
\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 16.2;
\t\t\t\tMARKETING_VERSION = 1.0;
\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = "com.nomaen.homeworkout.live-activity";
\t\t\t\tPRODUCT_NAME = "$(TARGET_NAME)";
\t\t\t\tSKIP_INSTALL = YES;
\t\t\t\tSWIFT_EMIT_LOC_STRINGS = YES;
\t\t\t\tSWIFT_VERSION = 5.0;
\t\t\t\tTARGETED_DEVICE_FAMILY = "1,2";
\t\t\t};
\t\t\tname = Debug;
\t\t};
\t\t#{LA_RELEASE_CONFIG} /* Release */ = {
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {
\t\t\t\tCODE_SIGN_STYLE = Automatic;
\t\t\t\tCURRENT_PROJECT_VERSION = 2;
\t\t\t\tDEVELOPMENT_TEAM = T33B88TGA8;
\t\t\t\tGENERATE_INFOPLIST_FILE = NO;
\t\t\t\tINFOPLIST_FILE = SimpleWorkoutGenLiveActivity/Info.plist;
\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 16.2;
\t\t\t\tMARKETING_VERSION = 1.0;
\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = "com.nomaen.homeworkout.live-activity";
\t\t\t\tPRODUCT_NAME = "$(TARGET_NAME)";
\t\t\t\tSKIP_INSTALL = YES;
\t\t\t\tSWIFT_EMIT_LOC_STRINGS = YES;
\t\t\t\tSWIFT_VERSION = 5.0;
\t\t\t\tTARGETED_DEVICE_FAMILY = "1,2";
\t\t\t};
\t\t\tname = Release;
\t\t};
PBXCFG

content.sub!("/* End XCBuildConfiguration section */", "#{la_configs}/* End XCBuildConfiguration section */")

# ── 11. XCConfigurationList ──
la_config_list = <<~PBXCL
\t\t#{LA_CONFIG_LIST} /* Build configuration list for PBXNativeTarget "SimpleWorkoutGenLiveActivity" */ = {
\t\t\tisa = XCConfigurationList;
\t\t\tbuildConfigurations = (
\t\t\t\t#{LA_DEBUG_CONFIG} /* Debug */,
\t\t\t\t#{LA_RELEASE_CONFIG} /* Release */,
\t\t\t);
\t\t\tdefaultConfigurationIsVisible = 0;
\t\t\tdefaultConfigurationName = Release;
\t\t};
PBXCL

content.sub!("/* End XCConfigurationList section */", "#{la_config_list}/* End XCConfigurationList section */")

File.write(PBXPROJ, content)
puts "Successfully added SimpleWorkoutGenLiveActivity target to project.pbxproj"
