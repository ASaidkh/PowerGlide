This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

>**Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.

## Step 1: Start the Metro Server

First, you will need to start **Metro**, the JavaScript _bundler_ that ships _with_ React Native.

To start Metro, run the following command from the _root_ of your React Native project:

```bash
# using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Start your Application

Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project. Run the following command to start your _Android_ or _iOS_ app:

### For Android

```bash
# using npm
npm run android

# OR using Yarn
yarn android
```

### For iOS

```bash
# using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.

## Step 3: Modifying your App

Now that you have successfully run the app, let's modify it.

1. Open `App.tsx` in your text editor of choice and edit some lines.
2. For **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Developer Menu** (<kbd>Ctrl</kbd> + <kbd>M</kbd> (on Window and Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (on macOS)) to see your changes!

   For **iOS**: Hit <kbd>Cmd ⌘</kbd> + <kbd>R</kbd> in your iOS Simulator to reload the app and see your changes!

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [Introduction to React Native](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you can't get this to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.

```
MyApp
├─ .bundle
│  └─ config
├─ .eslintrc.js
├─ .git
│  ├─ COMMIT_EDITMSG
│  ├─ config
│  ├─ description
│  ├─ FETCH_HEAD
│  ├─ fsmonitor--daemon
│  │  └─ cookies
│  ├─ HEAD
│  ├─ hooks
│  │  ├─ applypatch-msg.sample
│  │  ├─ commit-msg.sample
│  │  ├─ fsmonitor-watchman.sample
│  │  ├─ post-update.sample
│  │  ├─ pre-applypatch.sample
│  │  ├─ pre-commit.sample
│  │  ├─ pre-merge-commit.sample
│  │  ├─ pre-push.sample
│  │  ├─ pre-rebase.sample
│  │  ├─ pre-receive.sample
│  │  ├─ prepare-commit-msg.sample
│  │  ├─ push-to-checkout.sample
│  │  ├─ sendemail-validate.sample
│  │  └─ update.sample
│  ├─ index
│  ├─ info
│  │  └─ exclude
│  ├─ logs
│  │  ├─ HEAD
│  │  └─ refs
│  │     ├─ heads
│  │     │  ├─ Alim
│  │     │  ├─ main
│  │     │  ├─ Reta
│  │     │  └─ Reta_experimental
│  │     └─ remotes
│  │        └─ origin
│  │           ├─ Alim
│  │           ├─ HEAD
│  │           ├─ main
│  │           ├─ Reta
│  │           └─ Reta_experimental
│  ├─ objects
│  │  ├─ 03
│  │  │  └─ 28338e4f9d196c8960566fde3989c6e71e9b13
│  │  ├─ 05
│  │  │  └─ 56f1d72c098b635e83e78d27b8b794277a84ba
│  │  ├─ 07
│  │  │  └─ 22ced80b6abaffdc179c3d54cc047621ae0e77
│  │  ├─ 09
│  │  │  ├─ 67ef424bce6791893e9a57bb952f80fd536e93
│  │  │  └─ 75923f332a5069efdb7f9a95316d79f3da805d
│  │  ├─ 0a
│  │  │  └─ 44536c72f776712114602370b15119fa6dd1f4
│  │  ├─ 0c
│  │  │  └─ 37427f51869636b0d6a28ab5c23fc684cf08ce
│  │  ├─ 0e
│  │  │  └─ ce962e7e36abb0882385ebe46b1674c6809794
│  │  ├─ 10
│  │  │  └─ 9f494bd6f654f5301cd9ebafd4a3257fc1351f
│  │  ├─ 11
│  │  │  ├─ 5a4c768a20c9e13185c17043f4c4d12dd4632a
│  │  │  ├─ 8a16c8d0dbe253c279bcc085f44e6a5bd953ce
│  │  │  └─ b025724a3f7a4a3685bbcd27da16440749f5e8
│  │  ├─ 12
│  │  │  ├─ 470c30ecb5a2dba694ea638163fa6ec177646d
│  │  │  └─ 5fe1b98eb3befb478c2723fa79457e741fb083
│  │  ├─ 18
│  │  │  ├─ 7894b6af25ee34da3116166b4eeffaa07b622a
│  │  │  └─ fb59c4a43357835e27cf644e134669635a34d8
│  │  ├─ 1a
│  │  │  └─ 5a9087dcd0c67e1eadbe48f75299dee867538a
│  │  ├─ 1b
│  │  │  └─ 523998081149a985cef0cdf89045b9ed29964a
│  │  ├─ 25
│  │  │  ├─ b99c844f8715040a909f616b95d80dd14912ab
│  │  │  ├─ da30dbdeee93f6eaceea674c3b635de168ce06
│  │  │  └─ f25eb4766ea4e43eab262401091c835e3560ac
│  │  ├─ 29
│  │  │  ├─ 6b11fe0e7d1bd29ccb25c0d959bf31667b816d
│  │  │  └─ f93d37d40b886edffd9fe6bce448d5ff2920e2
│  │  ├─ 2a
│  │  │  └─ 7ce357c5b2aba6fdab0f13a86af514b550567b
│  │  ├─ 2b
│  │  │  └─ 540746a7575ead7fe308f2c78e38ca316b2382
│  │  ├─ 2d
│  │  │  ├─ 15c2d641211d7efc37788bd17881300d9ae93c
│  │  │  └─ 92bd53fdb2223e4d23bf1fb6c134fe72931116
│  │  ├─ 30
│  │  │  └─ 4ab4e2d83d0252ca10441b130d1239e1d0be74
│  │  ├─ 36
│  │  │  └─ 4e105ed39fbfd62001429a68140672b06ec0de
│  │  ├─ 3a
│  │  │  └─ 8fa3f4b1d822ece2cab34b59fcb1e592fb220f
│  │  ├─ 3d
│  │  │  └─ 5782c71568d32eec2fe71b034efcde053305f9
│  │  ├─ 41
│  │  │  └─ b8317f0652b9dafb97cd3dd3d245d0e74e1bf8
│  │  ├─ 45
│  │  │  └─ 9ca609d3ae0d3943ab44cdc27feef9256dc6d7
│  │  ├─ 47
│  │  │  └─ 4c1bb510dc8379179df2354459c74ed6e45f49
│  │  ├─ 4a
│  │  │  └─ 58bcebee9bc5e6f2ae1a5cd146a277243e3876
│  │  ├─ 4c
│  │  │  └─ 19a13c239cb67b8a2134ddd5f325db1d2d5bee
│  │  ├─ 50
│  │  │  └─ ac1db70a87870ac9224c5057149cbc63ff5883
│  │  ├─ 55
│  │  │  ├─ 043ccb1d7d0060734cd7a6d0f144e197c6912d
│  │  │  └─ fc4bfb3647cfa6bdcda0432bfb6c0a41e85eb4
│  │  ├─ 5a
│  │  │  └─ b82696cb97ae643370d566cf0fc4b41208c022
│  │  ├─ 5c
│  │  │  └─ 25e728ea2ce7724bd9ef08c87ce7ee89c77103
│  │  ├─ 5d
│  │  │  ├─ 2808256ca079f1592e258ae13d12d15381f2c5
│  │  │  └─ 402df40d2d22c184cef6bc4320531e11d430a6
│  │  ├─ 66
│  │  │  └─ aefb574fc56b6709ea09e683c743682caaaef9
│  │  ├─ 6e
│  │  │  ├─ 878281f34f3548d727f8ce185f8b4ea0350b7f
│  │  │  ├─ b3fd8f3fc9d0916367ad490c03143db1d5d6e8
│  │  │  └─ ef87b4249df12b69ca516f8918db53e4a65a3d
│  │  ├─ 6f
│  │  │  ├─ 1f35ba504d1c614e2076231238565ed42a93fb
│  │  │  └─ 7a6eb33e809897344f2d326d3d6ed7869cb39a
│  │  ├─ 76
│  │  │  └─ f523ceec8e9a481e730898a2191aa55a074645
│  │  ├─ 7b
│  │  │  └─ a83a2ad5a2c9be2d9eb2a4211590336f28209b
│  │  ├─ 7c
│  │  │  └─ 4c9a8ceec8915caabbfd4e74accf56be46b864
│  │  ├─ 7d
│  │  │  ├─ 08c142d327a9711faaef50a53d92b5af2e7bbe
│  │  │  └─ 43506232b6f576514752a6fdf5f53aa0b85a5d
│  │  ├─ 81
│  │  │  └─ 213230deb40de5b032ae0e05f5c74196cc1b07
│  │  ├─ 84
│  │  │  └─ 8943bb5274b1ec80390e731e8de3b9f5812d16
│  │  ├─ 89
│  │  │  └─ e8ea86bae1b8aeee03a8e18b44457f021fcc3f
│  │  ├─ 8c
│  │  │  └─ a12fe024be86e868d14e91120a6902f8e88ac6
│  │  ├─ 8e
│  │  │  ├─ 19b410a1b15ff180f3dacac19395fe3046cdec
│  │  │  └─ b675e9bc68ad09ee012d1b339eddb406e292a8
│  │  ├─ 9d
│  │  │  └─ 41685ef1bfc27dc719052a800ba021000e20ee
│  │  ├─ 9e
│  │  │  └─ ac6fbc87d2c39a36284595e7934a225fe183a6
│  │  ├─ 9f
│  │  │  └─ b15664bd5bb108e1f51b5e0c471614e1bc7e04
│  │  ├─ a2
│  │  │  └─ f5908281d070150700378b64a84c7db1f97aa1
│  │  ├─ a5
│  │  │  └─ d8cc1c0c719ab28eea8e0fc43dbbd25e31cd95
│  │  ├─ a8
│  │  │  └─ 50d031de79119ee024e9c2fe22809c31417ab3
│  │  ├─ b7
│  │  │  └─ 40cf13397ab16efc23cba3d6234ff8433403b1
│  │  ├─ b8
│  │  │  └─ 24ebdd48db917eea2e67a82260a100371f8a24
│  │  ├─ ba
│  │  │  └─ 72822e8728ef2951005e49b6c27a2f1da6572d
│  │  ├─ be
│  │  │  └─ cbccf1fb1165d5cc369e1af05081fdd11e18a0
│  │  ├─ c3
│  │  │  └─ 249afc565ace28458d2bf31d87adf72de8cd79
│  │  ├─ d0
│  │  │  └─ f0f45a3126c7d2f8ec0ff7b578d8f25e46f3f0
│  │  ├─ d1
│  │  │  └─ c021f605f4018750b10b4ad1410aaf207a5719
│  │  ├─ d5
│  │  │  ├─ 49f68cab7cc72620052c9985634b960eb828aa
│  │  │  └─ ae456695e5fc247f15a76bd0bf7fd560e2c780
│  │  ├─ d6
│  │  │  └─ 45c7246c42e45510cfcdcd7a7ff584a700d4c1
│  │  ├─ dc
│  │  │  ├─ ae416a111fe8b90b23b5f8efd35cbf2738fd63
│  │  │  └─ d3cd8083358269d6ed7894726283bb9bcbbfea
│  │  ├─ df
│  │  │  └─ 1ce4db3b1bfb2bc4c503f27515cba892392dac
│  │  ├─ e0
│  │  │  ├─ 307f989d45ae96b684c05720a4166001c96f8f
│  │  │  └─ 4fa043f89547365dd3b44533b78d4953753d35
│  │  ├─ e1
│  │  │  └─ 892528b8d0b0ef6af3762a86d0d764f2124eb3
│  │  ├─ e4
│  │  │  └─ 0418e9989708c37e9326af1f5db53277b76224
│  │  ├─ e6
│  │  │  └─ 441136f3d4ba8a0da8d277868979cfbc8ad796
│  │  ├─ e8
│  │  │  └─ d8d0f8266653d3a90a36e32f9c330197b56a50
│  │  ├─ eb
│  │  │  ├─ 98c01afd79a6ca551b3b638dc4a048d1315fb4
│  │  │  ├─ df0fb742995a09a82e37288507ea27c907a88b
│  │  │  └─ e8f06f71ab607c40e1dd0647c8734f6a7e3d39
│  │  ├─ f6
│  │  │  └─ 61a72262383d48110ea9c6c87ba470f66d157a
│  │  ├─ f7
│  │  │  └─ b3da3b33d1565e14c6aaf8884dc3d24c457992
│  │  ├─ f8
│  │  │  └─ ff779b194a956c14d24c7fd629916739fb36de
│  │  ├─ fa
│  │  │  └─ fecfe57bad5577fc457c525acbcfe463278246
│  │  ├─ fd
│  │  │  ├─ 35174adfd49b76e8b53fa3a3b3beee4b62e0ed
│  │  │  └─ 656b03414503a066ddd8a3992c76f16469d566
│  │  ├─ ff
│  │  │  └─ 10afd6e182edb2b1a63c8f984e9070d9f950ba
│  │  ├─ info
│  │  └─ pack
│  ├─ ORIG_HEAD
│  └─ refs
│     ├─ heads
│     │  ├─ Alim
│     │  ├─ main
│     │  ├─ Reta
│     │  └─ Reta_experimental
│     ├─ remotes
│     │  └─ origin
│     │     ├─ Alim
│     │     ├─ HEAD
│     │     ├─ main
│     │     ├─ Reta
│     │     └─ Reta_experimental
│     └─ tags
├─ .gitignore
├─ .prettierrc.js
├─ .vscode
│  └─ .react
├─ .watchmanconfig
├─ android
│  ├─ app
│  │  ├─ proguard-rules.pro
│  │  └─ src
│  │     ├─ debug
│  │     │  └─ AndroidManifest.xml
│  │     └─ main
│  │        ├─ AndroidManifest.xml
│  │        ├─ java
│  │        │  └─ com
│  │        │     └─ myapp
│  │        │        ├─ MainActivity.kt
│  │        │        └─ MainApplication.kt
│  │        └─ res
│  │           ├─ drawable
│  │           │  └─ rn_edit_text_material.xml
│  │           ├─ mipmap-hdpi
│  │           │  ├─ ic_launcher.png
│  │           │  └─ ic_launcher_round.png
│  │           ├─ mipmap-mdpi
│  │           │  ├─ ic_launcher.png
│  │           │  └─ ic_launcher_round.png
│  │           ├─ mipmap-xhdpi
│  │           │  ├─ ic_launcher.png
│  │           │  └─ ic_launcher_round.png
│  │           ├─ mipmap-xxhdpi
│  │           │  ├─ ic_launcher.png
│  │           │  └─ ic_launcher_round.png
│  │           ├─ mipmap-xxxhdpi
│  │           │  ├─ ic_launcher.png
│  │           │  └─ ic_launcher_round.png
│  │           └─ values
│  │              ├─ strings.xml
│  │              └─ styles.xml
│  ├─ gradle
│  │  └─ wrapper
│  │     ├─ gradle-wrapper.jar
│  │     └─ gradle-wrapper.properties
│  ├─ gradle.properties
│  ├─ gradlew
│  └─ gradlew.bat
├─ app.json
├─ App.tsx
├─ babel.config.js
├─ Gemfile
├─ index.js
├─ ios
│  ├─ .xcode.env
│  ├─ MyApp
│  │  ├─ AppDelegate.h
│  │  ├─ AppDelegate.mm
│  │  ├─ Images.xcassets
│  │  │  ├─ AppIcon.appiconset
│  │  │  │  └─ Contents.json
│  │  │  └─ Contents.json
│  │  ├─ Info.plist
│  │  ├─ LaunchScreen.storyboard
│  │  ├─ main.m
│  │  └─ PrivacyInfo.xcprivacy
│  ├─ MyApp.xcodeproj
│  │  ├─ project.pbxproj
│  │  └─ xcshareddata
│  │     └─ xcschemes
│  │        └─ MyApp.xcscheme
│  ├─ MyAppTests
│  │  ├─ Info.plist
│  │  └─ MyAppTests.m
│  └─ Podfile
├─ jest.config.js
├─ metro.config.js
├─ package-lock.json
├─ package.json
├─ README.md
├─ tsconfig.json
└─ __tests__
   └─ App.test.tsx

```