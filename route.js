import express from 'express'
import Screen from './model'
import Map from './modelMap'

const router = express.Router()

router.get('/all', (req, res) => {
  Screen.find().then(screens => {
    if (!screens) {
      res.status(404).json({ error: 'Not Found' })
    }
    res.json(screens)
  })
})

router.get('/:id', (req, res) => {
  Screen.findById(req.params.id).then(screen => {
    if (!screen) {
      res.status(404).json({ error: 'Not Found' })
    }
    var opts = [{ path: 'screen', select: 'title', model: 'screen' }]
    Screen.populate(screen, opts, function(err, user) {
      res.json(user)
    })
  })
})

const createScreen = async (screen, parent) => {
  const { title, description } = screen
  const newScreen = Screen({
    title,
    description,
    parent: parent
  })
  const childrenRefs = parent.children
  newScreen.save().then(async newScreenFromDB => {
    childrenRefs.push(newScreenFromDB._id)
    if (screen.children.length) {
      screen.children.forEach(async child => {
        await createScreen(child, newScreenFromDB)
      })
    }
    await Screen.findByIdAndUpdate(
      parent._id,
      {
        children: childrenRefs
      },
      { new: true, useFindAndModify: false }
    )
  })
}

router.post('/createMap', async (req, res) => {
  const { title, description } = req.body
  let rootScreen = new Screen({
    title,
    description
  })
  rootScreen = await rootScreen.save()
  await req.body.children.forEach(async screen => {
    await createScreen(screen, rootScreen)
  })
  res.json(rootScreen)
})

router.post('/createOne', async (req, res) => {
  const newScreen = new Screen(req.body)
  const parent = await Screen.findById(req.body.parent)
  newScreen
    .save()
    .then(async screen => {
      parent.children.push(screen._id)
      await parent.save()
      res.json(screen)
    })
    .catch(err => console.log(err))
})

router.put('/update/:id', async (req, res) => {
  const newParentId = req.body.parent
  const oldParentId = (await Screen.findById(req.params.id)).parent
  const screenUpdated = await Screen.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      useFindAndModify: true,
      new: true
    }
  )
  const newParent = await Screen.findById(newParentId)
  if (oldParentId == '') {
    newParent.children.push(screenUpdated._id)
    await newParent.save()
  }
  if (newParentId == oldParentId) {
    if (!newParent.children.includes(screenUpdated._id)) {
      newParent.children.push(screenUpdated._id)
    }
  } else {
    const oldParent = await Screen.findById(oldParentId)
    const index = oldParent.children.indexOf(screenUpdated._id)
    oldParent.children.splice(index, 1)
    newParent.children.push(screenUpdated._id)
    await oldParent.save()
  }
  await newParent.save()
  res.json(screenUpdated)
})

export default router
