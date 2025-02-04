const axios = require("axios");

const posts = [
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/IMG_0015-1618f72c-23d5-40d9-b72f-fdb369b6a72f.jpeg",
      Content:
        "http://s3stage.api.climatechange.gay/IMG_0015-1618f72c-23d5-40d9-b72f-fdb369b6a72f.jpeg",
      PostItemType: 1,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/tree-736885_1280-9c5d0d02-4b9e-4396-910b-57732681cde7.jpg",
      Content:
        "http://s3stage.api.climatechange.gay/tree-736885_1280-9c5d0d02-4b9e-4396-910b-57732681cde7.jpg",
      PostItemType: 1,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/g-a306ed71-3fb8-41fe-a339-152b50f28cf0.jpg",
      Content:
        "http://s3stage.api.climatechange.gay/g-a306ed71-3fb8-41fe-a339-152b50f28cf0.jpg",
      PostItemType: 1,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/Snapinsta.app_video_8F447B94FB247EF410A00C4885C844B8_video_dashinit-12664444-2304-46b3-bea0-9651486cc098.mp4",
      Content:
        "http://s3stage.api.climatechange.gay/Snapinsta.app_video_8F447B94FB247EF410A00C4885C844B8_video_dashinit-12664444-2304-46b3-bea0-9651486cc098.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-729a573e-71a8-4ea8-88ef-ff529d0a4697.png",
      Content:
        "http://s3stage.api.climatechange.gay/Snapinsta.app_video_E243227213A2CBCBD60F5DB7940F3295_video_dashinit-95e27c8b-6ceb-4c90-9e4d-c5fda7e5ec81.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-71514d54-9dba-457c-8dfa-8def70419319.png",
      Content:
        "http://s3stage.api.climatechange.gay/Andrew Tate - Forgot Your Name (Ft. KrissKiss) (Music Video)-2805b567-2b74-424b-8430-a1244724add7.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-7e1b2517-5a4f-4508-9015-35dea6de0971.png",
      Content:
        "http://s3stage.api.climatechange.gay/Snapinsta.app_video_1240C0D2F91782B32D0226D0DEBAB496_video_dashinit-7785a2d4-2ece-4a24-9b1f-c2cd860537a4.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-9d1091cd-1f0d-49f8-90d1-8610de4609eb.png",
      Content:
        "http://s3stage.api.climatechange.gay/Snapinsta.app_video_D74AC79003B5292BB6DE6AE907E4CC91_video_dashinit-ca154a53-7f55-4412-92e1-ba0832846703.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-db49160e-96e9-4799-9389-e486a9b1b341.png",
      Content:
        "http://s3stage.api.climatechange.gay/Snaptik.app_7430903323814825249-270dea8e-3413-41a9-81ea-a69281fa66ae.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-30a319a6-43d4-4bc2-bf4b-d3382ba3ef80.png",
      Content:
        "http://s3stage.api.climatechange.gay/85bb31bed75cc-0a3457dd-ee97-43b1-a226-a62cecba949d.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-b51b9585-61f0-4b9c-8c4a-4b7fb592d5a5.png",
      Content:
        "http://s3stage.api.climatechange.gay/Snapinsta.app_video_An9c_89c5psVKYr035Wl5TdKUl7It-7j7kjL3jfYpSzzeZYnypYh7kg5d1bHavtzzLsdzlyRcwwBfUvdHmSLuWjW-70931bc6-2af1-4a1b-90df-25eccb4041bc.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-0147d80f-1478-45f2-825a-32b28b442ffd.png",
      Content:
        "http://s3stage.api.climatechange.gay/Snapinsta.app_video_An-aYvMPSnIyWWyQFUCjhOJqip5ThCAdlMp_fEcOWmLwluzTa-kgqLaXT8Fb3HaR1_BkGrnlG5x27R1vn8sG73rL-d639c7b7-4945-41ec-8b81-e8eb10791656.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-08571c12-8bab-47c8-b6cf-b8c17bb00ee0.png",
      Content:
        "http://s3stage.api.climatechange.gay/Snapinsta.app_video_An-SZNfWqWxLzsU1PsrjiHM8WlOP0At--3IDdkrIdoahEdiWA27toYphoK5Xo9GnKMpb9s9276R1yO33oPfTO8kt-717c28b8-239d-4142-9b99-14a9203104d5.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-7882405c-2b6a-4cfe-b41d-1a4e7e0ef30b.png",
      Content:
        "http://s3stage.api.climatechange.gay/Snapinsta.app_video_9E4EB9DE3E4FABF38C22CF54CFD935AD_video_dashinit-f535a4ea-2845-42a0-a27c-bf1dd530232e.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-3b581db7-3108-4dc3-8eb9-5e1cead8edab.png",
      Content:
        "http://s3stage.api.climatechange.gay/videoplayback-1052a78d-5ebc-4e80-bd25-9abd5715837d.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-6cac5d3e-8177-4f39-a8bf-d30c580e00c5.png",
      Content:
        "http://s3stage.api.climatechange.gay/Snapinsta.app_video_4B483C64DBCAC7690F9F4F2314B99BBE_video_dashinit-5389eda8-6b03-4b33-9fed-7c0838145eae.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-3be309f4-0502-4653-a80c-b95ed4fd7163.png",
      Content:
        "http://s3stage.api.climatechange.gay/Snapinsta.app_video_0D46620334E680EB889BF19E63FFFCAE_video_dashinit-1e79c093-bac6-49c1-bad0-33fb90287134.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/img-b0f2e458-379b-4cb9-ba15-05f2cb5056a0.jpg",
      Content:
        "http://s3stage.api.climatechange.gay/img-b0f2e458-379b-4cb9-ba15-05f2cb5056a0.jpg",
      PostItemType: 1,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/img-a531bf65-40a3-43a1-8315-72b3e14e7c9d.jpg",
      Content:
        "http://s3stage.api.climatechange.gay/img-a531bf65-40a3-43a1-8315-72b3e14e7c9d.jpg",
      PostItemType: 1,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-8a3621d9-5c54-4492-a52d-76291c6193e6.png",
      Content:
        "http://s3stage.api.climatechange.gay/11901556_1080_1920_30fps-7124be71-ace1-4a1c-b1b6-8e0d50c2bbaa.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-b773c19f-757d-4387-bc91-caa0358f3a91.png",
      Content:
        "http://s3stage.api.climatechange.gay/Snapinsta.app_video_0D46620334E680EB889BF19E63FFFCAE_video_dashinit-cf4a922b-6120-49c1-8889-15d3c6657b08.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/Snapinsta.app_video_194F6DBDEFF32FB5C3D0AA3DBCBFAC96_video_dashinit-db1a9021-1ba0-4f77-bc0f-3433d2db3520.mp4",
      Content:
        "http://s3stage.api.climatechange.gay/Snapinsta.app_video_194F6DBDEFF32FB5C3D0AA3DBCBFAC96_video_dashinit-db1a9021-1ba0-4f77-bc0f-3433d2db3520.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-d049dfcb-4533-4423-8820-84e4031c78bc.png",
      Content:
        "http://s3stage.api.climatechange.gay/Snapinsta.app_video_404FA0134D5CF50DD8445050F2AC46A0_video_dashinit-1022abdc-402a-4361-8d80-7d4f6409a138.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-ca5e85d9-c719-418e-a1d4-23b35ffa18cb.png",
      Content:
        "http://s3stage.api.climatechange.gay/4830364-sd_506_960_25fps-7b57c474-3060-4963-a94e-06ce08b98431.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-95eb48fb-290c-4e2f-b975-a5ad91081584.png",
      Content:
        "http://s3stage.api.climatechange.gay/8382685-sd_506_960_25fps-d417eb3a-7772-467a-b63b-82f08a9418b3.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-86081f8a-729e-4102-8078-61c6e1fc9701.png",
      Content:
        "http://s3stage.api.climatechange.gay/4830364-sd_506_960_25fps-f8239f76-a36e-445d-88d4-f9e5252a8539.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-04962def-5b98-44cb-9d47-85c53a18b586.png",
      Content:
        "http://s3stage.api.climatechange.gay/6831465-sd_540_960_25fps-d787d645-b654-4d7d-9902-09dcf1dbc233.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-6720ae97-7879-4520-b2e2-7d2fd50a393b.png",
      Content:
        "http://s3stage.api.climatechange.gay/12037346_540_960_30fps-f96051dc-c830-4adc-b81b-57c6b22f5def.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-af135907-4d73-4800-8a28-fdfc51e9c602.png",
      Content:
        "http://s3stage.api.climatechange.gay/Snapinsta.app_video_8F447B94FB247EF410A00C4885C844B8_video_dashinit-ee72e1f2-7126-4053-8cfd-551d17dec160.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-1f101e00-84c1-463c-98a6-5d80913bc62b.png",
      Content:
        "http://s3stage.api.climatechange.gay/converted_30fps-3b0c0355-2c8f-4420-8e62-94d34de5f14d.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-03eedbdd-3df9-4a1c-8d51-0cb666214323.png",
      Content:
        "http://s3stage.api.climatechange.gay/converted_30fps-68fa48b5-76ee-4735-a363-92efada34449.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-7efdb8f5-3f8a-4045-8bf9-84d3296fb8cd.png",
      Content:
        "http://s3stage.api.climatechange.gay/11900269_540_960_30fps-41f5d3bc-b55a-4ac0-9085-5e47f757c231.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
  [
    {
      Order: 0,
      ThumNail:
        "http://s3stage.api.climatechange.gay/thumbnail-ff23af9b-a979-4cfa-830f-2d0a2eac6123.png",
      Content:
        "http://s3stage.api.climatechange.gay/FDownloader.Net_AQPiQjc7Q8QWstC1I4xJFA44BynmN_fJydS6ttQQtfWCSEOHZKLd0-FUgKKJN5Foxu4mLmhomuWz5fcFS0SHv4RS_720p_(HD)-7a12f421-b03a-493e-992e-160d464f4bcd.mp4",
      PostItemType: 2,
      Width: 0.0,
      Height: 0.0,
    },
  ],
];

const convertTaskWithWrongCallback = async (post) => {
  let data = {
    Id: Math.floor(Math.random() * 1000000000000000),
    PostItems: JSON.stringify(post),
    callbackUrl: "http://localhost2:3000/callback",
  };

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "http://localhost:3000/convert",
    headers: {
      "x-api-key": "0996e2b7b9610413fec1866477424fb1",
      "Content-Type": "application/json",
    },
    data: data,
  };

  return new Promise((resolve, reject) => {
    axios
      .request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
        resolve(response.data);
      })
      .catch((error) => {
        console.log(error);
        reject(error);
      });
  });
};

const convertTaskWithRightCallback = async (post) => {
  let data = {
    Id: Math.floor(Math.random() * 1000000000000000),
    PostItems: JSON.stringify(post),
    callbackUrl: "http://localhost2:3000/callback",
  };

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "http://localhost:3000/convert",
    headers: {
      "x-api-key": "dakbhduy93ehudfvuieuhdndbquia3",
      "Content-Type": "application/json",
    },
    data: data,
  };

  return new Promise((resolve, reject) => {
    axios
      .request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
        resolve(response.data);
      })
      .catch((error) => {
        console.log(error);
        reject(error);
      });
  });
};

const startRegularTesting = async () => {
  for (let i = 0; i < posts.length; i++) {
    let post = posts[i];
    await convertTaskWithWrongCallback(post);
  }
};

const startDuplicateErrorTesting = async () => {
  for (let i = 0; i < 2; i++) {
    let post = posts[1];
    await convertTaskWithWrongCallback(post);
  }
};

startRegularTesting();
